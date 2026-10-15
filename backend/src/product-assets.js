import { randomUUID } from 'node:crypto';
import express from 'express';
import { ApiError, bad } from './validation.js';

export const generatedCode = productId => `ART-${String(productId).padStart(6, '0')}`;
export function articleCode(value, fallback) {
  const code = value === undefined || value === '' ? fallback : typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (!/^[A-Z0-9][A-Z0-9._-]{2,39}$/.test(code ?? '')) bad('El código debe tener de 3 a 40 letras, números, puntos o guiones.');
  return code;
}

export function publicImageRoutes(app, store) {
  app.get('/api/images/:key', async (req, res) => {
    if (!/^[a-f0-9-]{36}$/.test(req.params.key)) throw new ApiError(404, 'Imagen no encontrada.');
    const image = (await store.listRecords('images', { key: req.params.key }))[0];
    if (!image) throw new ApiError(404, 'Imagen no encontrada.');
    res.set({ 'Content-Type': image.mimeType, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=86400' });
    res.send(Buffer.from(image.data, 'base64'));
  });
}

export function imageUploadRoutes(app, store, admin) {
  app.post('/api/images', admin, express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '3mb' }), async (req, res) => {
    const bytes = req.body;
    if (!Buffer.isBuffer(bytes) || !bytes.length) bad('Selecciona una foto JPG, PNG o WebP de hasta 3 MB.');
    const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    const mimeType = png ? 'image/png' : jpeg ? 'image/jpeg' : webp ? 'image/webp' : null;
    if (!mimeType || req.get('Content-Type')?.split(';')[0] !== mimeType) bad('El archivo no es una imagen JPG, PNG o WebP válida.');
    const key = randomUUID();
    await store.insertRecord('images', { key, mimeType, data: bytes.toString('base64'), uploadedBy: req.user.id });
    res.status(201).json({ imageUrl: `/api/images/${key}` });
  });
}

export async function productMetadata(tx, productId, body, pharmacyId = 1) {
  const existing = await tx.productById(productId);
  const code = articleCode(body.code, existing.code ?? generatedCode(productId));
  if (existing.code && code !== existing.code) bad('El código del artículo no cambia; registra otro artículo para utilizar otro código.');
  const matches = await tx.listRecords('products', { code, pharmacyId });
  if (matches.some(p => p.id !== productId)) throw new ApiError(409, 'Este artículo ya existe en la farmacia; utiliza un movimiento para reponer stock.');
  const catalog = (await tx.listRecords('articles', { code }))[0];
  if (!catalog && body.code && code.startsWith('ART-') && code !== generatedCode(productId)) bad('Los códigos ART- se generan automáticamente. Usa otro prefijo para códigos manuales.');
  if (catalog && catalog.name.toLocaleLowerCase() !== body.name.trim().toLocaleLowerCase()) {
    if (!existing.code) throw new ApiError(409, 'Este código pertenece a otro artículo. Usa el nombre del catálogo compartido.');
    await tx.updateRecord('articles', catalog.id, { name: body.name.trim() });
    for (const product of await tx.listRecords('products', { code })) await tx.updateRecord('products', product.id, { name: body.name.trim() });
  }
  if (!catalog) await tx.insertRecord('articles', { code, name: body.name.trim() });
  const imageUrl = body.imageUrl === undefined ? existing.imageUrl ?? '' : body.imageUrl;
  if (typeof imageUrl !== 'string' || (imageUrl && !/^\/api\/images\/[a-f0-9-]{36}$/.test(imageUrl))) bad('La imagen debe cargarse desde el formulario de productos.');
  if (imageUrl && !(await tx.listRecords('images', { key: imageUrl.split('/').pop() })).length) bad('La imagen no existe.');
  await tx.updateRecord('products', productId, { code, imageUrl, pharmacyId });
  return code;
}
