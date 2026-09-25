import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../src/database.js';
import { createApp, businessDate } from '../src/app.js';
import { hashPassword, tokenHash } from '../src/security.js';
import { configuration } from '../src/config.js';

const medicine = { name: 'Paracetamol 500mg', category: 'Analgésico', price: 12.35, stock: 5, expirationDate: '2026-10-10' };
async function fixture(t) {
  const db = openDatabase(':memory:');
  const hash = await hashPassword('clave-prueba');
  db.prepare('INSERT INTO users(name, username, password_hash, role) VALUES (?, ?, ?, ?)').run('Admin', 'admin', hash, 'admin');
  db.prepare('INSERT INTO users(name, username, password_hash, role) VALUES (?, ?, ?, ?)').run('Empleado', 'employee', hash, 'employee');
  let date = new Date('2026-09-25T16:00:00Z');
  const app = await createApp({ db, now: () => date });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => { await new Promise((resolve) => server.close(resolve)); db.close(); });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function request(path, { method = 'GET', token, body, headers = {}, raw } = {}) {
    const response = await fetch(base + path, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined || raw ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined) });
    const value = await response.text();
    return { status: response.status, body: value ? JSON.parse(value) : null, headers: response.headers };
  }
  const login = async (username = 'admin') => (await request('/auth/login', { method: 'POST', body: { username, password: 'clave-prueba' } })).body.token;
  return { db, request, login, setDate: (value) => { date = new Date(value); } };
}

test('login contract, password secrecy, current user and persisted hashed session', async (t) => {
  const f = await fixture(t);
  const result = await f.request('/auth/login', { method: 'POST', body: { username: 'ADMIN', password: 'clave-prueba' } });
  assert.equal(result.status, 200);
  assert.equal(result.body.user.role, 'admin');
  assert.equal(result.body.user.password_hash, undefined);
  assert.match(result.body.token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(f.db.prepare('SELECT token_hash FROM sessions').get().token_hash, tokenHash(result.body.token));
  assert.equal((await f.request('/auth/me', { token: result.body.token })).body.username, 'admin');
  for (const username of ['admin', 'missing']) {
    const response = await f.request('/auth/login', { method: 'POST', body: { username, password: 'incorrecta' } });
    assert.equal(response.status, 401);
    assert.equal(response.body.message, 'Usuario o contraseña incorrectos.');
  }
});

test('anonymous and employee cannot perform administrative operations', async (t) => {
  const f = await fixture(t);
  assert.equal((await f.request('/products')).status, 401);
  assert.equal((await f.request('/products', { token: 'invalid' })).status, 401);
  const token = await f.login('employee');
  for (const [method, path] of [['GET', '/users'], ['POST', '/users'], ['PUT', '/users/1'], ['DELETE', '/users/1'], ['POST', '/products'], ['PUT', '/products/1'], ['DELETE', '/products/1']]) {
    assert.equal((await f.request(path, { method, token, body: method === 'POST' || method === 'PUT' ? {} : undefined })).status, 403, `${method} ${path}`);
  }
  assert.equal((await f.request('/products', { token })).status, 200);
});

test('create, list, edit and delete user; duplicate usernames and invalid roles', async (t) => {
  const f = await fixture(t);
  const token = await f.login();
  const data = { name: 'Ana', username: 'ana', password: 'secreto', role: 'employee' };
  const created = await f.request('/users', { method: 'POST', token, body: data });
  assert.equal(created.status, 201);
  assert.equal(created.body.password, undefined);
  const employeeLogin = await f.request('/auth/login', { method: 'POST', body: { username: 'ana', password: 'secreto' } });
  assert.equal(employeeLogin.status, 200);
  assert.equal(employeeLogin.body.user.role, 'employee');
  assert.notEqual(f.db.prepare('SELECT password_hash FROM users WHERE username = ?').get('ana').password_hash, 'secreto');
  assert.equal((await f.request('/users', { method: 'POST', token, body: { ...data, username: 'ANA' } })).status, 409);
  assert.equal((await f.request('/users', { method: 'POST', token, body: { ...data, role: 'root' } })).status, 400);
  assert.equal((await f.request('/users', { method: 'POST', token, body: { ...data, password: '123' } })).status, 400);
  assert.equal((await f.request('/users', { token })).body.length, 3);
  const edit = await f.request(`/users/${created.body.id}`, { method: 'PUT', token, body: { name: 'Ana editada', username: 'ana', role: 'admin' } });
  assert.equal(edit.body.name, 'Ana editada');
  assert.equal(edit.body.role, 'admin');
  assert.equal((await f.request(`/users/${created.body.id}`, { method: 'DELETE', token })).status, 204);
  assert.equal((await f.request(`/users/${created.body.id}`, { method: 'DELETE', token })).status, 404);
});

test('deleting a user immediately revokes an already issued token', async (t) => {
  const f = await fixture(t);
  const admin = await f.login();
  const employee = await f.login('employee');
  assert.equal((await f.request('/users/2', { method: 'DELETE', token: admin })).status, 204);
  assert.equal((await f.request('/products', { token: employee })).status, 401);
  assert.equal((await f.request('/auth/login', { method: 'POST', body: { username: 'employee', password: 'clave-prueba' } })).status, 401);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM sessions WHERE user_id = 2').get().n, 0);
});

test('editing users invalidates sessions and protects the last administrator', async (t) => {
  const f = await fixture(t);
  const admin = await f.login();
  const employee = await f.login('employee');
  assert.equal((await f.request('/users/1', { method: 'DELETE', token: admin })).status, 409);
  assert.equal((await f.request('/users/1', { method: 'PUT', token: admin, body: { name: 'Admin', username: 'admin', role: 'employee' } })).status, 409);
  assert.equal((await f.request('/users/2', { method: 'PUT', token: admin, body: { name: 'Empleado', username: 'employee', password: 'nueva-clave', role: 'employee' } })).status, 200);
  assert.equal((await f.request('/products', { token: employee })).status, 401);
  assert.equal((await f.request('/auth/login', { method: 'POST', body: { username: 'employee', password: 'nueva-clave' } })).status, 200);
});

test('logout and expiry reject old sessions', async (t) => {
  const f = await fixture(t);
  const token = await f.login();
  assert.equal((await f.request('/auth/logout', { method: 'POST', token })).status, 204);
  assert.equal((await f.request('/products', { token })).status, 401);
  const second = await f.login();
  f.setDate('2026-09-26T01:00:00Z');
  assert.equal((await f.request('/products', { token: second })).status, 401);
});

test('product CRUD matches frontend objects and bare list response', async (t) => {
  const f = await fixture(t);
  const token = await f.login();
  const created = await f.request('/products', { method: 'POST', token, body: medicine });
  assert.equal(created.status, 201);
  assert.equal(created.body.price, 12.35);
  assert.equal(created.body.expirationDate, '2026-10-10');
  assert.equal(created.body.lowStock, true);
  const list = await f.request('/products', { token });
  assert.ok(Array.isArray(list.body));
  assert.equal(list.body[0].id, created.body.id);
  assert.equal((await f.request(`/products/${created.body.id}`, { token: await f.login('employee') })).status, 200);
  const updated = await f.request(`/products/${created.body.id}`, { method: 'PUT', token, body: { ...medicine, price: 20, stock: 10, expirationDate: '2027-01-15' } });
  assert.equal(updated.body.price, 20);
  assert.equal(updated.body.lowStock, false);
  assert.equal(updated.body.expirationDate, '2027-01-15');
  const free = await f.request(`/products/${created.body.id}`, { method: 'PUT', token, body: { ...medicine, price: 0 } });
  assert.equal(free.status, 200);
  assert.equal(free.body.price, 0);
  const invalid = await f.request(`/products/${created.body.id}`, { method: 'PUT', token, body: { ...medicine, stock: -1 } });
  assert.equal(invalid.status, 400);
  assert.equal((await f.request(`/products/${created.body.id}`, { token })).body.price, 0);
  assert.equal((await f.request(`/products/${created.body.id}`, { method: 'DELETE', token })).status, 204);
  assert.equal((await f.request(`/products/${created.body.id}`, { token })).status, 404);
});

test('invalid money, quantities, dates and missing fields are rejected without writes', async (t) => {
  const f = await fixture(t);
  const token = await f.login();
  for (const patch of [{ price: -1 }, { price: 1e-10 }, { price: 1.001 }, { price: '10' }, { price: null }, { stock: -1 }, { stock: 1.2 }, { stock: '3' }, { expirationDate: '2027-02-29' }, { expirationDate: '2026-09-25' }, { expirationDate: '2020-01-01' }, { expirationDate: null }, { name: ' ' }, { category: '' }]) {
    assert.equal((await f.request('/products', { method: 'POST', token, body: { ...medicine, ...patch } })).status, 400, JSON.stringify(patch));
  }
  assert.equal((await f.request('/products', { token })).body.length, 0);
  assert.equal((await f.request('/products/abc', { token })).status, 400);
  assert.equal((await f.request('/products/999', { token })).status, 404);
});

test('search, category, low stock and strict less-than-30-day expiration boundaries', async (t) => {
  const f = await fixture(t);
  const token = await f.login();
  for (const [name, expiry, stock] of [['Hoy', '2026-09-25', 0], ['Mañana', '2026-09-26', 5], ['Día29', '2026-10-24', 6], ['Día30', '2026-10-25', 10], ['Vencido', '2026-09-24', 4]]) {
    f.db.prepare('INSERT INTO products(name, category, price_cents, stock, expiration_date) VALUES (?, ?, ?, ?, ?)').run(name, 'Analgésico', 100, stock, expiry);
  }
  const soon = await f.request('/products?expiringSoon=true', { token });
  assert.deepEqual(soon.body.map((p) => p.name), ['Hoy', 'Mañana', 'Día29']);
  assert.equal((await f.request('/products?lowStock=true', { token })).body.length, 3);
  const expired = await f.request('/products?expired=true', { token });
  assert.equal(expired.body.length, 1);
  assert.ok(expired.body.every((p) => p.availableForSale === false));
  assert.equal((await f.request('/products?search=ma%C3%B1ana', { token })).body[0].name, 'Mañana');
  assert.equal((await f.request('/products?category=Analg%C3%A9sico', { token })).body.length, 5);
  assert.equal((await f.request('/products?search=&category=Analg%C3%A9sico&lowStock=true&expired=false', { token })).body.length, 2);
  assert.equal((await f.request('/products?search=Hoy&category=Otra', { token })).body.length, 0);
  assert.equal((await f.request('/products?search=%27%20OR%201%3D1--', { token })).body.length, 0);
  assert.equal((await f.request('/products?expiringSoon=true', { token: await f.login('employee') })).status, 403);
  assert.equal((await f.request('/products?lowStock=maybe', { token })).status, 400);
  assert.equal((await f.request('/products?search=a&search=b', { token })).status, 400);
});

test('JSON errors, payload limits, CORS and security headers', async (t) => {
  const f = await fixture(t);
  const token = await f.login();
  assert.equal((await f.request('/products', { method: 'POST', token, raw: '{oops' })).status, 400);
  assert.equal((await f.request('/products', { method: 'POST', token, body: { name: 'a'.repeat(20000) } })).status, 413);
  const allowed = await f.request('/products', { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173' } });
  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  assert.equal((await f.request('/products', { token, headers: { Origin: 'https://untrusted.example' } })).status, 403);
  const health = await f.request('/health');
  assert.equal(health.status, 200);
  assert.equal(health.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(health.headers.get('x-powered-by'), null);
  assert.equal((await f.request('/missing', { token })).status, 404);
});

test('login throttling limits repeated attempts', async (t) => {
  const f = await fixture(t);
  for (let index = 0; index < 20; index++) assert.equal((await f.request('/auth/login', { method: 'POST', body: {} })).status, 400);
  const result = await f.request('/auth/login', { method: 'POST', body: {} });
  assert.equal(result.status, 429);
  assert.equal(result.headers.get('retry-after'), '900');
  f.setDate('2026-09-25T16:16:00Z');
  assert.equal((await f.request('/auth/login', { method: 'POST', body: {} })).status, 400);
});

test('database persists records and migrations are idempotent', () => {
  const directory = mkdtempSync(join(tmpdir(), 'pharmacy-test-'));
  const path = join(directory, 'test.sqlite');
  let db;
  try {
    db = openDatabase(path);
    db.prepare('INSERT INTO products(name, category, price_cents, stock, expiration_date) VALUES (?, ?, ?, ?, ?)').run('Persistente', 'Otros', 100, 3, '2027-01-01');
    db.close();
    db = openDatabase(path);
    assert.equal(db.prepare('SELECT name FROM products').get().name, 'Persistente');
    assert.equal(db.prepare('SELECT count(*) AS n FROM migrations').get().n, 1);
  } finally { db?.close(); rmSync(directory, { recursive: true, force: true }); }
});

test('business dates follow configured timezone, configuration rejects invalid values', () => {
  assert.equal(businessDate(new Date('2026-09-26T02:00:00Z'), 'America/La_Paz'), '2026-09-25');
  assert.equal(configuration({}).port, 3000);
  for (const env of [{ PORT: 'abc' }, { SESSION_HOURS: '-1' }, { CORS_ORIGINS: '*' }, { BUSINESS_TIME_ZONE: 'bad-zone' }]) assert.throws(() => configuration(env));
});
