export class ApiError extends Error {
  constructor(status, message, errors) { super(message); this.status = status; this.errors = errors; }
}
export const bad = (message, errors) => { throw new ApiError(400, message, errors); };
export function object(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) bad('Se requiere un objeto JSON.');
}
export function text(value, field, max = 120) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    bad('Datos no válidos.', { [field]: `Campo obligatorio, máximo ${max} caracteres.` });
  }
  return value.trim();
}
export function password(value) {
  if (typeof value !== 'string' || value.length < 6 || Buffer.byteLength(value) > 256) {
    bad('Datos no válidos.', { password: 'Debe contener al menos 6 caracteres y como máximo 256 bytes.' });
  }
  return value;
}
export function userInput(body, editing = false) {
  object(body);
  const name = text(body.name, 'name');
  const username = text(body.username, 'username', 80).toLowerCase();
  if (!/^[a-z0-9._-]+$/.test(username)) bad('Usuario no válido: utiliza letras sin acentos, números, punto, guion o guion bajo.');
  if (!['admin', 'employee'].includes(body.role)) bad('Rol no válido.');
  const result = { name, username, role: body.role };
  if (!editing || body.password !== undefined) result.password = password(body.password);
  return result;
}
export function productInput(body, today) {
  object(body);
  const name = text(body.name, 'name');
  const category = text(body.category, 'category', 80);
  const { price, stock, expirationDate } = body;
  const cents = Math.round(price * 100);
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0 || (price > 0 && cents === 0) || cents > 999999999 || Math.abs(price * 100 - cents) > 0.000001) {
    bad('Datos no válidos.', { price: 'Precio no negativo, máximo 9999999.99 y hasta dos decimales.' });
  }
  if (!Number.isInteger(stock) || stock < 0 || stock > 2147483647) bad('Datos no válidos.', { stock: 'Stock entero entre 0 y 2147483647.' });
  if (typeof expirationDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(expirationDate) ||
      !Number.isFinite(Date.parse(expirationDate)) || new Date(expirationDate).toISOString().slice(0, 10) !== expirationDate || expirationDate <= today) {
    bad('Datos no válidos.', { expirationDate: 'Fecha real YYYY-MM-DD posterior a hoy.' });
  }
  return { name, category, cents, stock, expirationDate };
}
export function id(value) {
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) bad('Identificador no válido.');
  return Number(value);
}
