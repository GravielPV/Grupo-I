import { createHash, randomInt, randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { ApiError, bad, id, object } from './validation.js';
import { belongsTo, pharmacyFilter } from './pharmacies.js';
import { quantity } from './stock.js';

const fingerprint = items => createHash('sha256').update(JSON.stringify(items.map(i => ({ product: Number(i.product), quantity: i.quantity, cents: Math.round(i.unitPrice * 100) })).sort((a, b) => a.product - b.product))).digest('hex');
const fixtures = {
  approved: { last4: '4242', brand: 'Visa demo', status: 'approved', message: 'Pago aprobado' },
  declined: { last4: '0002', brand: 'Visa demo', status: 'declined', message: 'Tarjeta rechazada por el emisor simulado' },
  insufficient: { last4: '9995', brand: 'Visa demo', status: 'declined', message: 'Fondos insuficientes en la tarjeta de prueba' },
};

export function cardRoutes(app, store) {
  app.post('/api/card-payments', async (req, res) => {
    object(req.body);
    const fixture = Object.hasOwn(fixtures, req.body.testCard) ? fixtures[req.body.testCard] : null;
    if (!fixture || req.body.cardNumber !== undefined || req.body.cvv !== undefined) bad('Selecciona una tarjeta de demostración. No se aceptan datos de tarjetas reales.');
    if (!Array.isArray(req.body.items) || !req.body.items.length || req.body.items.length > 100) bad('El carrito no es válido.');
    await delay(1000);
    const payment = await store.transaction(async tx => {
      const cash = (await tx.listRecords('cash_sessions', { ...pharmacyFilter(req.pharmacyId), status: 'open' }))[0];
      if (!cash) throw new ApiError(409, 'Abre la caja antes de simular el pago.');
      let cents = 0; const items = []; const seen = new Set();
      for (const input of req.body.items) {
        object(input); const productId = id(input.product); const count = quantity(input.quantity);
        if (seen.has(productId)) bad('Producto repetido.'); seen.add(productId);
        const product = await tx.productById(productId);
        if (!belongsTo(product, req.pharmacyId)) throw new ApiError(404, 'Producto no encontrado en esta farmacia.');
        if (product.stock < count) throw new ApiError(409, 'Stock insuficiente.');
        cents += product.price_cents * count;
        if (!Number.isSafeInteger(cents) || cents > 999999999) bad('Total fuera de rango.');
        items.push({ product: String(productId), quantity: count, unitPrice: product.price_cents / 100 });
      }
      const data = { ...fixture, simulated: true, reference: `DEMO-${randomUUID()}`, authorizationCode: fixture.status === 'approved' ? String(randomInt(100000, 1000000)) : null, amount: cents / 100,
        pharmacyId: req.pharmacyId, userId: req.user.id, cashSessionId: cash.id, fingerprint: fingerprint(items), expiresAt: Date.now() + 5 * 60000, consumed: false };
      const inserted = await tx.insertRecord('card_payments', data);
      return { id: inserted.lastInsertRowid, ...data };
    });
    res.status(payment.status === 'approved' ? 201 : 402).json({ id: payment.id, simulated: true, reference: payment.reference, authorizationCode: payment.authorizationCode, status: payment.status, message: payment.message, last4: payment.last4, brand: payment.brand, amount: payment.amount });
  });
}

export async function consumeCardPayment(tx, paymentId, pharmacyId, cashSessionId, items, cents, userId) {
  if (!paymentId) bad('Autoriza primero el pago en el terminal de demostración.');
  const payment = await tx.recordById('card_payments', id(paymentId));
  if (!payment || payment.userId !== userId || payment.pharmacyId !== pharmacyId || payment.cashSessionId !== cashSessionId || payment.status !== 'approved' || payment.consumed || payment.expiresAt <= Date.now()) throw new ApiError(409, 'La autorización de tarjeta no está disponible. Vuelve a simular el pago.');
  if (Math.round(payment.amount * 100) !== cents || payment.fingerprint !== fingerprint(items)) throw new ApiError(409, 'El carrito o los precios cambiaron. Autoriza de nuevo el pago.');
  await tx.updateRecord('card_payments', payment.id, { consumed: true, consumedAt: new Date().toISOString() });
  return { simulated: true, reference: payment.reference, authorizationCode: payment.authorizationCode, last4: payment.last4, brand: payment.brand, amount: payment.amount, status: 'approved' };
}
