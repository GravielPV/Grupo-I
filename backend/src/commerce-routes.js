import { ApiError, bad, object, text, id } from './validation.js';
import { batchesFor, changeStock, quantity } from './stock.js';
import { belongsTo, pharmacyFilter } from './pharmacies.js';
import { cardRoutes, consumeCardPayment } from './card-payments.js';

export const defaultSettings = { pharmacyName: 'Tu Pharmacy', rnc: '', phone: '', email: '', address: '', receiptMessage: '¡Gracias por su compra!', currency: 'DOP', currencySymbol: 'RD$' };
const view = row => row ? { ...row, _id: String(row.id), createdAt: row.created_at } : null;
const actor = user => ({ id: user.id, _id: String(user.id), name: user.name, username: user.username });
const money = value => {
  const cents = Math.round(value * 100);
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || cents > 999999999 || Math.abs(value * 100 - cents) > 0.000001) bad('Monto no válido; usa hasta dos decimales.');
  return cents;
};
const payment = value => { if (!['cash', 'card', 'transfer'].includes(value)) bad('Método de pago no válido.'); return value; };
const found = async (tx, name, value, pharmacyId = 1) => { const row = await tx.recordById(name, id(value)); if (!belongsTo(row, pharmacyId)) throw new ApiError(404, 'Registro no encontrado.'); return row; };
const adminCheck = async (tx, user) => { if ((await tx.userById(user.id))?.role !== 'admin') throw new ApiError(403, 'Se requiere el rol administrador.'); };
export const currentCash = async (tx, pharmacyId = 1) => (await tx.listRecords('cash_sessions', { ...pharmacyFilter(pharmacyId), status: 'open' }))[0];

export async function cashSummary(tx, session) {
  const sales = (await tx.listRecords('sales', { cashSessionId: session.id })).filter(s => s.status !== 'cancelled');
  const returns = await tx.listRecords('returns', { cashSessionId: session.id });
  const sum = (rows, field, methodField, method) => rows.filter(r => !method || r[methodField] === method).reduce((n, r) => n + Math.round(r[field] * 100), 0) / 100;
  const totalSales = sum(sales, 'total');
  const cashSales = sum(sales, 'total', 'paymentMethod', 'cash');
  const cashRefunds = sum(returns, 'total', 'refundMethod', 'cash');
  return { salesCount: sales.length, unitsSold: sales.reduce((n, s) => n + s.items.reduce((m, i) => m + i.quantity, 0), 0), totalSales, cashSales,
    cardSales: sum(sales, 'total', 'paymentMethod', 'card'), transferSales: sum(sales, 'total', 'paymentMethod', 'transfer'),
    returnsCount: returns.length, totalRefunds: sum(returns, 'total'), cashRefunds, cardRefunds: sum(returns, 'total', 'refundMethod', 'card'), transferRefunds: sum(returns, 'total', 'refundMethod', 'transfer'),
    expectedCash: (Math.round(session.openingAmount * 100) + Math.round(cashSales * 100) - Math.round(cashRefunds * 100)) / 100 };
}

export function commerceRoutes(app, store, admin, today) {
  cardRoutes(app, store);
  app.get('/api/settings', async (req, res) => {
    const saved = await store.getSettings(req.pharmacyId);
    const result = { ...defaultSettings };
    for (const key of Object.keys(result)) if (saved?.[key] !== undefined) result[key] = saved[key];
    res.json(result);
  });
  app.put('/api/settings', admin, async (req, res) => {
    object(req.body);
    const data = {};
    for (const key of Object.keys(defaultSettings)) {
      const value = req.body[key] ?? defaultSettings[key];
      if (typeof value !== 'string' || value.length > 500) bad('Configuración no válida.');
      data[key] = value.trim();
    }
    text(data.pharmacyName, 'pharmacyName');
    text(data.currencySymbol, 'currencySymbol', 10);
    try { new Intl.NumberFormat('es-DO', { style: 'currency', currency: data.currency }); } catch { bad('Moneda no válida.'); }
    await store.transaction(async tx => { await adminCheck(tx, req.user); await tx.saveSettings(data, req.pharmacyId); });
    res.json(data);
  });

  app.get('/api/locations', async (req, res) => res.json((await store.listRecords('locations', pharmacyFilter(req.pharmacyId))).map(view)));
  const saveLocation = async (req, res) => {
    object(req.body);
    const data = { pharmacyId: req.pharmacyId, section: text(req.body.section, 'section', 40).toUpperCase(), shelf: text(req.body.shelf, 'shelf', 40), level: text(req.body.level, 'level', 40) };
    const row = await store.transaction(async tx => {
      await adminCheck(tx, req.user);
      const target = req.params.id ? await found(tx, 'locations', req.params.id, req.pharmacyId) : null;
      const same = (await tx.listRecords('locations', data)).find(r => r.id !== target?.id);
      if (same) throw new ApiError(409, 'La ubicación ya existe.');
      if (target) { await tx.updateRecord('locations', target.id, data); return { ...target, ...data }; }
      const result = await tx.insertRecord('locations', data); return tx.recordById('locations', result.lastInsertRowid);
    });
    res.status(req.params.id ? 200 : 201).json(view(row));
  };
  app.post('/api/locations', admin, saveLocation);
  app.put('/api/locations/:id', admin, saveLocation);
  app.delete('/api/locations/:id', admin, async (req, res) => {
    await store.transaction(async tx => {
      await adminCheck(tx, req.user);
      const row = await found(tx, 'locations', req.params.id, req.pharmacyId);
      if ((await tx.listProducts()).some(p => p.locationId === row.id)) throw new ApiError(409, 'La ubicación tiene productos asociados.');
      await tx.deleteRecord('locations', row.id);
    }); res.sendStatus(204);
  });

  const getBatches = async (req, res) => {
    const result = await store.transaction(async tx => {
      const products = req.params.id ? [await tx.productById(id(req.params.id))] : (await tx.listProducts()).filter(p => belongsTo(p, req.pharmacyId));
      if (products.some(p => !belongsTo(p, req.pharmacyId))) throw new ApiError(404, 'Producto no encontrado.');
      const rows = [];
      for (const p of products) for (const b of await batchesFor(tx, p)) rows.push({ ...view(b), product: { id: p.id, _id: String(p.id), name: p.name } });
      return rows;
    }); res.json(result);
  };
  app.get('/api/batches', getBatches);
  app.get('/api/batches/product/:id', getBatches);
  app.post('/api/batches', admin, async (req, res) => {
    object(req.body);
    const productId = id(req.body.product);
    const stock = quantity(req.body.stock ?? req.body.quantity);
    const batchNumber = text(req.body.batchNumber, 'batchNumber', 80);
    const date = req.body.expirationDate;
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || date <= today()) bad('Fecha de lote no válida.');
    const row = await store.transaction(async tx => {
      await adminCheck(tx, req.user);
      const p = await tx.productById(productId); if (!belongsTo(p, req.pharmacyId)) throw new ApiError(404, 'Producto no encontrado.');
      await batchesFor(tx, p);
      if ((await tx.listRecords('batches', { productId, batchNumber })).length) throw new ApiError(409, 'El lote ya existe.');
      if (p.stock + stock > 2147483647) bad('Stock fuera de rango.');
      const result = await tx.insertRecord('batches', { productId, stock, batchNumber, expirationDate: date });
      await tx.setStock(productId, p.stock + stock);
      await tx.insertMovement({ pharmacyId: req.pharmacyId, product: { id: p.id, _id: String(p.id), name: p.name }, user: actor(req.user), type: 'entrada', quantity: stock, reason: `Nuevo lote ${batchNumber}`, previousStock: p.stock, newStock: p.stock + stock });
      return tx.recordById('batches', result.lastInsertRowid);
    }); res.status(201).json(view(row));
  });

  const cashView = async (tx, row) => row ? { ...view(row), ...(row.status === 'open' ? await cashSummary(tx, row) : {}), summary: row.status === 'open' ? await cashSummary(tx, row) : row.summary } : null;
  app.get('/api/cash-sessions/current', async (req, res) => res.json(await cashView(store, await currentCash(store, req.pharmacyId))));
  app.get('/api/cash-sessions', async (req, res) => res.json(await Promise.all((await store.listRecords('cash_sessions', pharmacyFilter(req.pharmacyId))).map(s => cashView(store, s)))));
  app.get('/api/cash-sessions/:id', async (req, res) => res.json(await cashView(store, await found(store, 'cash_sessions', req.params.id, req.pharmacyId))));
  app.post('/api/cash-sessions/open', async (req, res) => {
    object(req.body); const openingAmount = money(req.body.openingAmount) / 100;
    const row = await store.transaction(async tx => {
      if (await currentCash(tx, req.pharmacyId)) throw new ApiError(409, 'Ya hay una caja abierta.');
      const result = await tx.insertRecord('cash_sessions', { pharmacyId: req.pharmacyId, status: 'open', openingAmount, openedAt: new Date().toISOString(), openedBy: actor(req.user) });
      await tx.updateRecord('cash_sessions', result.lastInsertRowid, { sessionNumber: `CAJA-${result.lastInsertRowid}` });
      return cashView(tx, await tx.recordById('cash_sessions', result.lastInsertRowid));
    }); res.status(201).json(row);
  });
  app.post('/api/cash-sessions/close', async (req, res) => {
    object(req.body); const countedCash = money(req.body.countedCash) / 100;
    const row = await store.transaction(async tx => {
      const current = await currentCash(tx, req.pharmacyId); if (!current) throw new ApiError(409, 'No hay caja abierta.');
      if (current.openedBy.id !== req.user.id) await adminCheck(tx, req.user);
      const summary = await cashSummary(tx, current);
      const data = { ...summary, summary, status: 'closed', countedCash, difference: Math.round((countedCash - summary.expectedCash) * 100) / 100, closedBy: actor(req.user), closedAt: new Date().toISOString() };
      await tx.updateRecord('cash_sessions', current.id, data); return view({ ...current, ...data });
    }); res.json(row);
  });

  app.get('/api/sales', async (req, res) => {
    const sessions = new Map((await store.listRecords('cash_sessions', pharmacyFilter(req.pharmacyId))).map(s => [s.id, s]));
    res.json((await store.listRecords('sales', pharmacyFilter(req.pharmacyId))).map(s => ({ ...view(s), cashSession: { ...s.cashSession, status: sessions.get(s.cashSessionId)?.status } })));
  });
  app.post('/api/sales', async (req, res) => {
    object(req.body); const method = payment(req.body.paymentMethod);
    if (!Array.isArray(req.body.items) || !req.body.items.length || req.body.items.length > 100) bad('Selecciona de 1 a 100 productos.');
    const row = await store.transaction(async tx => {
      const cash = await currentCash(tx, req.pharmacyId); if (!cash) throw new ApiError(409, 'Abre la caja antes de registrar ventas.');
      const items = []; const seen = new Set(); let cents = 0;
      for (const input of req.body.items) {
        object(input); const productId = id(input.product); const count = quantity(input.quantity);
        if (seen.has(productId)) bad('Producto repetido.'); seen.add(productId);
        const changed = await changeStock(tx, productId, -count, { today: today(), pharmacyId: req.pharmacyId });
        const p = changed.product; const subtotal = p.price_cents * count;
        cents += subtotal; if (!Number.isSafeInteger(cents) || cents > 999999999) bad('Total fuera de rango.');
        items.push({ product: String(p.id), productCode: p.code, productName: p.name, quantity: count, unitPrice: p.price_cents / 100, subtotal: subtotal / 100, allocations: changed.allocations });
        await tx.insertMovement({ pharmacyId: req.pharmacyId, product: { id: p.id, _id: String(p.id), name: p.name }, user: actor(req.user), type: 'salida', quantity: count, reason: 'Venta', previousStock: changed.previousStock, newStock: changed.newStock });
      }
      const cardPayment = method === 'card' ? await consumeCardPayment(tx, req.body.paymentId, req.pharmacyId, cash.id, items, cents, req.user.id) : null;
      const received = method === 'cash' ? money(req.body.amountReceived) : cents;
      if (received < cents) bad('El monto recibido es menor que el total.');
      const result = await tx.insertRecord('sales', { pharmacyId: req.pharmacyId, payment: cardPayment, items, total: cents / 100, paymentMethod: method, amountReceived: received / 100, change: (received - cents) / 100, status: 'completed', user: actor(req.user), cashSessionId: cash.id, cashSession: { _id: String(cash.id), sessionNumber: cash.sessionNumber } });
      await tx.updateRecord('sales', result.lastInsertRowid, { saleNumber: `VENTA-${result.lastInsertRowid}` });
      return view(await tx.recordById('sales', result.lastInsertRowid));
    }); res.status(201).json(row);
  });
  app.patch('/api/sales/:id/cancel', admin, async (req, res) => {
    const row = await store.transaction(async tx => {
      await adminCheck(tx, req.user); const sale = await found(tx, 'sales', req.params.id, req.pharmacyId);
      if (sale.status === 'cancelled') throw new ApiError(409, 'La venta ya está anulada.');
      const cash = await currentCash(tx, req.pharmacyId);
      if (!cash || cash.id !== sale.cashSessionId) throw new ApiError(409, 'Solo se pueden anular ventas de la caja abierta actual.');
      if ((await tx.listRecords('returns', { saleId: sale.id })).length) throw new ApiError(409, 'La venta tiene devoluciones; no se puede anular.');
      for (const item of sale.items) {
        const changed = await changeStock(tx, Number(item.product), item.quantity, { allocations: item.allocations, pharmacyId: req.pharmacyId });
        await tx.insertMovement({ pharmacyId: req.pharmacyId, product: { id: changed.product.id, _id: item.product, name: item.productName }, user: actor(req.user), type: 'entrada', quantity: item.quantity, reason: `Anulación ${sale.saleNumber}`, previousStock: changed.previousStock, newStock: changed.newStock });
      }
      const data = { status: 'cancelled', cancelledBy: actor(req.user), cancelledAt: new Date().toISOString(), ...(sale.payment ? { payment: { ...sale.payment, status: 'voided', voidReference: `DEMO-VOID-${crypto.randomUUID()}` } } : {}) };
      await tx.updateRecord('sales', sale.id, data); return view({ ...sale, ...data });
    }); res.json(row);
  });

  app.get('/api/returns', async (req, res) => res.json((await store.listRecords('returns', pharmacyFilter(req.pharmacyId))).map(view)));
  app.get('/api/returns/sale/:id', async (req, res) => {
    const sale = await found(store, 'sales', req.params.id, req.pharmacyId);
    res.json((await store.listRecords('returns', { saleId: sale.id })).map(view));
  });
  app.post('/api/returns', admin, async (req, res) => {
    object(req.body); const method = payment(req.body.refundMethod); const reason = text(req.body.reason, 'reason', 300);
    if (!Array.isArray(req.body.items) || !req.body.items.length || req.body.items.length > 100) bad('Selecciona los productos a devolver.');
    const row = await store.transaction(async tx => {
      await adminCheck(tx, req.user); const sale = await found(tx, 'sales', req.body.saleId, req.pharmacyId);
      if (sale.status === 'cancelled') throw new ApiError(409, 'No se puede devolver una venta anulada.');
      const cash = await currentCash(tx, req.pharmacyId); if (!cash) throw new ApiError(409, 'Abre la caja para registrar la devolución.');
      const previous = await tx.listRecords('returns', { saleId: sale.id });
      const items = []; const seen = new Set(); let cents = 0;
      for (const input of req.body.items) {
        object(input); const productId = id(input.productId); const count = quantity(input.quantity);
        if (seen.has(productId)) bad('Producto repetido.'); seen.add(productId);
        const original = sale.items.find(i => Number(i.product) === productId);
        const returned = previous.flatMap(r => r.items).filter(i => Number(i.product) === productId);
        if (!original || count + returned.reduce((n, i) => n + i.quantity, 0) > original.quantity) throw new ApiError(409, 'La cantidad supera lo disponible para devolver.');
        let remaining = count; const allocations = [];
        for (const allocation of original.allocations) {
          const used = returned.flatMap(i => i.allocations).filter(a => a.batch === allocation.batch).reduce((n, a) => n + a.quantity, 0);
          const take = Math.min(remaining, allocation.quantity - used);
          if (take > 0) { allocations.push({ batch: allocation.batch, quantity: take }); remaining -= take; }
        }
        const changed = await changeStock(tx, productId, count, { allocations, pharmacyId: req.pharmacyId });
        const subtotal = Math.round(original.unitPrice * 100) * count; cents += subtotal;
        items.push({ product: String(productId), productCode: original.productCode, productName: original.productName, unitPrice: original.unitPrice, quantity: count, subtotal: subtotal / 100, allocations });
        await tx.insertMovement({ pharmacyId: req.pharmacyId, product: { id: productId, _id: String(productId), name: original.productName }, user: actor(req.user), type: 'entrada', quantity: count, reason: `Devolución ${sale.saleNumber}`, previousStock: changed.previousStock, newStock: changed.newStock });
      }
      const result = await tx.insertRecord('returns', { pharmacyId: req.pharmacyId, refundReference: method === 'card' ? `DEMO-REFUND-${crypto.randomUUID()}` : null, saleId: sale.id, sale: { _id: String(sale.id), saleNumber: sale.saleNumber }, cashSessionId: cash.id, user: actor(req.user), items, total: cents / 100, refundMethod: method, reason });
      await tx.updateRecord('returns', result.lastInsertRowid, { returnNumber: `DEV-${result.lastInsertRowid}` });
      return view(await tx.recordById('returns', result.lastInsertRowid));
    }); res.status(201).json(row);
  });
}
