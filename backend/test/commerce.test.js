import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { openMongoDatabase } from '../src/mongo-store.js';
import { createApp } from '../src/app.js';
import { hashPassword } from '../src/security.js';

test('complete frontend contract: settings, locations, batches, cash, sales, cancellations and returns', async t => {
  const repl = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  t.after(() => repl.stop());
  const config = { mongoUri: repl.getUri(), mongoDatabase: 'commerce_test' };
  const store = await openMongoDatabase(config);
  t.after(() => store.close());
  const hash = await hashPassword('test-password');
  await store.insertUser('Admin', 'admin', hash, 'admin');
  await store.insertUser('Employee', 'employee', hash, 'employee');
  const app = await createApp({ store });
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function request(path, method = 'GET', body, token = admin) {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, body: response.status === 204 ? null : await response.json() };
  }
  let admin;
  admin = (await request('/auth/login', 'POST', { username: 'admin', password: 'test-password' })).body.token;
  const employee = (await request('/auth/login', 'POST', { username: 'employee', password: 'test-password' })).body.token;
  const expectStatus = (response, status) => { assert.equal(response.status, status, JSON.stringify(response.body)); return response.body; };

  for (const path of ['/settings', '/locations', '/batches', '/sales', '/returns', '/cash-sessions', '/cash-sessions/current']) {
    expectStatus(await request(path), 200);
    expectStatus(await request(path, 'GET', undefined, null), 401);
  }
  const settings = expectStatus(await request('/settings'), 200);
  expectStatus(await request('/settings', 'PUT', { ...settings, pharmacyName: 'Farmacia de prueba' }), 200);
  expectStatus(await request('/settings', 'PUT', settings, employee), 403);
  assert.equal((await request('/settings')).body.pharmacyName, 'Farmacia de prueba');
  const location = expectStatus(await request('/locations', 'POST', { section: 'A', shelf: '1', level: '2' }), 201);
  expectStatus(await request('/locations', 'POST', { section: 'A', shelf: '1', level: '2' }), 409);
  const productData = { name: 'Medicina', category: 'General', price: 12.35, stock: 10, expirationDate: '2099-10-10', location: location._id };
  const product = expectStatus(await request('/products', 'POST', productData), 201);
  assert.equal(product._id, String(product.id));
  assert.equal(product.location.section, 'A');
  expectStatus(await request(`/locations/${location._id}`, 'PUT', { section: 'B', shelf: '1', level: '2' }), 200);
  assert.equal((await request(`/products/${product.id}`)).body.location.section, 'B');
  expectStatus(await request(`/locations/${location._id}`, 'DELETE'), 409);
  expectStatus(await request('/products', 'POST', { ...productData, location: '9999' }), 400);
  assert.equal((await store.listProducts()).length, 1);
  const batches = expectStatus(await request(`/batches/product/${product.id}`), 200);
  assert.equal(batches[0].stock, 10);
  expectStatus(await request('/movements', 'POST', { product: product._id, batch: batches[0]._id, type: 'entrada', quantity: 2, reason: 'Reposición' }), 201);
  assert.equal((await request(`/batches/product/${product.id}`)).body[0].stock, 12);
  expectStatus(await request('/movements', 'POST', { product: product._id, batch: '9999', type: 'salida', quantity: 1, reason: 'Error' }), 409);
  assert.equal((await store.productById(product.id)).stock, 12);

  const salePayload = { items: [{ product: product._id, quantity: 2 }], paymentMethod: 'cash', amountReceived: 30 };
  expectStatus(await request('/sales', 'POST', salePayload), 409);
  const openings = await Promise.all([request('/cash-sessions/open', 'POST', { openingAmount: 100 }), request('/cash-sessions/open', 'POST', { openingAmount: 100 })]);
  assert.deepEqual(openings.map(r => r.status).sort(), [201, 409]);
  const current = (await request('/cash-sessions/current')).body;
  assert.equal(current.summary.expectedCash, 100);
  const sale = expectStatus(await request('/sales', 'POST', salePayload, employee), 201);
  assert.equal(sale.total, 24.7); assert.equal(sale.change, 5.3); assert.equal(sale.items[0].product, product._id);
  assert.equal((await store.productById(product.id)).stock, 10);
  assert.equal((await request('/cash-sessions/current')).body.summary.expectedCash, 124.7);
  const badSale = { ...salePayload, items: [{ product: product._id, quantity: 1 }, { product: '9999', quantity: 1 }] };
  expectStatus(await request('/sales', 'POST', badSale), 404);
  expectStatus(await request('/sales', 'POST', { ...salePayload, amountReceived: 1 }), 400);
  assert.equal((await store.productById(product.id)).stock, 10);
  assert.equal((await request('/sales')).body.length, 1);
  expectStatus(await request(`/sales/${sale._id}/cancel`, 'PATCH', undefined, employee), 403);
  const cancel = expectStatus(await request(`/sales/${sale._id}/cancel`, 'PATCH'), 200);
  assert.equal(cancel.status, 'cancelled');
  assert.equal((await store.productById(product.id)).stock, 12);
  expectStatus(await request(`/sales/${sale._id}/cancel`, 'PATCH'), 409);
  assert.equal((await request('/cash-sessions/current')).body.summary.expectedCash, 100);

  const second = expectStatus(await request('/sales', 'POST', salePayload), 201);
  const returnPayload = { saleId: second._id, items: [{ productId: product._id, quantity: 1 }], reason: 'Envase dañado', refundMethod: 'cash' };
  expectStatus(await request('/returns', 'POST', returnPayload, employee), 403);
  const returned = expectStatus(await request('/returns', 'POST', returnPayload), 201);
  assert.equal(returned.total, 12.35);
  assert.equal((await request(`/returns/sale/${second._id}`)).body.length, 1);
  assert.equal((await store.productById(product.id)).stock, 11);
  const cash = (await request('/cash-sessions/current')).body;
  assert.equal(cash.summary.cashRefunds, 12.35); assert.equal(cash.summary.expectedCash, 112.35);
  expectStatus(await request(`/sales/${second._id}/cancel`, 'PATCH'), 409);
  const concurrent = await Promise.all([request('/returns', 'POST', returnPayload), request('/returns', 'POST', returnPayload)]);
  assert.deepEqual(concurrent.map(r => r.status).sort(), [201, 409]);
  assert.equal((await store.productById(product.id)).stock, 12);
  const closed = expectStatus(await request('/cash-sessions/close', 'POST', { countedCash: 100 }), 200);
  assert.equal(closed.difference, 0); assert.equal(closed.expectedCash, 100);
  assert.equal((await request('/cash-sessions/current')).body, null);
  expectStatus(await request(`/cash-sessions/${closed._id}`), 200);
  expectStatus(await request('/cash-sessions/close', 'POST', { countedCash: 100 }), 409);
  expectStatus(await request(`/sales/${second._id}/cancel`, 'PATCH'), 409);
  expectStatus(await request(`/products/${product.id}`, 'DELETE'), 409);

  // La API rechaza ventas vencidas y dos salidas que compiten por el mismo stock.
  await request('/cash-sessions/open', 'POST', { openingAmount: 0 });
  await store.updateRecord('batches', batches[0].id, { expirationDate: '2000-01-01' });
  expectStatus(await request('/sales', 'POST', salePayload), 409);
  await store.updateRecord('batches', batches[0].id, { expirationDate: '2099-10-10' });
  const largeSale = { ...salePayload, items: [{ product: product._id, quantity: 10 }], amountReceived: 200 };
  const competing = await Promise.all([request('/sales', 'POST', largeSale), request('/sales', 'POST', largeSale)]);
  assert.deepEqual(competing.map(r => r.status).sort(), [201, 409]);
  assert.equal((await store.productById(product.id)).stock, 2);
  assert.equal((await request(`/batches/product/${product.id}`)).body[0].stock, 2);

  const additionalBatch = expectStatus(await request('/batches', 'POST', { product: product._id, batchNumber: 'LOTE-2', stock: 3, expirationDate: '2098-01-01' }), 201);
  expectStatus(await request('/batches', 'POST', { product: product._id, batchNumber: 'LOTE-2', stock: 1, expirationDate: '2098-01-01' }), 409);
  const fefoSale = expectStatus(await request('/sales', 'POST', { ...salePayload, items: [{ product: product._id, quantity: 4 }], amountReceived: 100 }), 201);
  assert.equal(fefoSale.items[0].allocations[0].batch, additionalBatch.id);
  assert.equal(fefoSale.items[0].allocations[0].quantity, 3);
  const finalBatches = (await request(`/batches/product/${product.id}`)).body;
  assert.equal(finalBatches.reduce((n, b) => n + b.stock, 0), 1);
  assert.equal((await store.productById(product.id)).stock, 1);

  // Persistencia en una segunda conexión, sin tocar Atlas.
  const reopened = await openMongoDatabase(config);
  try {
    assert.equal((await reopened.getSettings()).pharmacyName, 'Farmacia de prueba');
    assert.equal((await reopened.listRecords('sales')).length, 4);
    assert.equal((await reopened.listRecords('returns')).length, 2);
  } finally { await reopened.close(); }
});
