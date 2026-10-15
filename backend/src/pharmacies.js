import { ApiError, bad, object, text, id } from './validation.js';
import { generatedCode } from './product-assets.js';

export const pharmacyOf = row => row.pharmacyId ?? 1;
export const belongsTo = (row, pharmacyId) => row && pharmacyOf(row) === pharmacyId;
export const pharmacyFilter = pharmacyId => pharmacyId === 1 ? { $or: [{ pharmacyId: 1 }, { pharmacyId: { $exists: false } }] } : { pharmacyId };
const view = row => ({ id: row.id, _id: String(row.id), name: row.name, address: row.address ?? '', phone: row.phone ?? '' });

export function pharmacyRoutes(app, store, admin, today) {
  app.get('/api/pharmacies', async (req, res) => res.json((await store.listRecords('pharmacies')).map(view)));
  app.post('/api/pharmacies', admin, async (req, res) => {
    object(req.body);
    const name = text(req.body.name, 'name');
    const address = typeof req.body.address === 'string' ? req.body.address.trim() : '';
    const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
    if (address.length > 300 || phone.length > 40) bad('Dirección o teléfono demasiado largo.');
    const row = await store.transaction(async tx => {
      if ((await tx.userById(req.user.id))?.role !== 'admin') throw new ApiError(403, 'Se requiere el rol administrador.');
      if ((await tx.listRecords('pharmacies')).some(p => p.name.toLocaleLowerCase() === name.toLocaleLowerCase())) throw new ApiError(409, 'Ya existe una farmacia con ese nombre.');
      const result = await tx.insertRecord('pharmacies', { name, address, phone });
      return tx.recordById('pharmacies', result.lastInsertRowid);
    }); res.status(201).json(view(row));
  });
  app.get('/api/availability', async (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLocaleLowerCase() : '';
    if (search.length > 120) bad('Búsqueda demasiado larga.');
    const pharmacies = new Map((await store.listRecords('pharmacies')).map(p => [p.id, p]));
    const products = (await store.listProducts()).filter(p => !search || `${p.code ?? generatedCode(p.id)} ${p.name}`.toLocaleLowerCase().includes(search));
    const batches = await store.listRecords('batches');
    const grouped = new Map();
    for (const p of products) {
      const code = p.code ?? generatedCode(p.id);
      const ownBatches = batches.filter(b => b.productId === p.id);
      const availableStock = ownBatches.length ? ownBatches.filter(b => b.expirationDate >= today()).reduce((n, b) => n + b.stock, 0) : p.expiration_date >= today() ? p.stock : 0;
      if (!grouped.has(code)) grouped.set(code, { code, name: p.name, category: p.category, imageUrl: p.imageUrl ?? '', pharmacies: [] });
      if (!grouped.get(code).imageUrl && p.imageUrl) grouped.get(code).imageUrl = p.imageUrl;
      const pharmacy = pharmacies.get(pharmacyOf(p));
      if (pharmacy) grouped.get(code).pharmacies.push({ ...view(pharmacy), productId: p.id, stock: p.stock, availableStock, available: availableStock > 0, price: p.price_cents / 100 });
    }
    res.json({ updatedAt: new Date().toISOString(), articles: [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name)) });
  });
}

export async function pharmacyContext(req, store) {
  const pharmacyId = id(req.get('X-Pharmacy-Id') ?? '1');
  if (!await store.recordById('pharmacies', pharmacyId)) throw new ApiError(400, 'La farmacia seleccionada no existe.');
  req.pharmacyId = pharmacyId;
}
