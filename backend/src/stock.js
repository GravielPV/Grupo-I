import { ApiError, bad, id } from './validation.js';
import { belongsTo } from './pharmacies.js';

export async function batchesFor(tx, product) {
  let batches = await tx.listRecords('batches', { productId: product.id });
  if (!batches.length) {
    const result = await tx.insertRecord('batches', { productId: product.id, batchNumber: `INICIAL-${product.id}`, stock: product.stock, expirationDate: product.expiration_date });
    batches = [await tx.recordById('batches', result.lastInsertRowid)];
  }
  return batches;
}

export function quantity(value) {
  if (!Number.isInteger(value) || value < 1 || value > 2147483647) bad('Cantidad entera positiva requerida.');
  return value;
}

export async function changeStock(tx, productId, delta, { batchId, today, allocations, pharmacyId = 1 } = {}) {
  const product = await tx.productById(productId);
  if (!belongsTo(product, pharmacyId)) throw new ApiError(404, 'Producto no encontrado en esta farmacia.');
  const next = product.stock + delta;
  if (!Number.isSafeInteger(next) || next < 0 || next > 2147483647) throw new ApiError(409, 'Stock insuficiente o fuera de rango.');
  const batches = await batchesFor(tx, product);
  const used = [];
  if (delta > 0) {
    const targets = allocations ?? [{ batch: batchId ? id(batchId) : batches[0].id, quantity: delta }];
    if (targets.reduce((sum, item) => sum + item.quantity, 0) !== delta) bad('Distribución de lotes incorrecta.');
    for (const item of targets) {
      const batch = batches.find(b => b.id === Number(item.batch));
      if (!batch) throw new ApiError(409, 'Lote no válido para el producto.');
      await tx.updateRecord('batches', batch.id, { stock: batch.stock + item.quantity });
      used.push({ batch: batch.id, quantity: item.quantity });
    }
  } else {
    let remaining = -delta;
    const candidates = batches.filter(b => (!batchId || b.id === id(batchId)) && (!today || b.expirationDate >= today))
      .sort((a, b) => a.expirationDate.localeCompare(b.expirationDate) || a.id - b.id);
    for (const batch of candidates) {
      const take = Math.min(remaining, batch.stock);
      if (take) {
        await tx.updateRecord('batches', batch.id, { stock: batch.stock - take });
        used.push({ batch: batch.id, quantity: take });
        remaining -= take;
      }
    }
    if (remaining) throw new ApiError(409, 'Stock insuficiente en los lotes disponibles; no se venden lotes vencidos.');
  }
  await tx.setStock(productId, next);
  return { product, previousStock: product.stock, newStock: next, allocations: used };
}
