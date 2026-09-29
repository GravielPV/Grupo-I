import { ApiError, bad, object, text, id } from './validation.js';

export function inventoryRoutes(app, store, admin) {
  const category = (row) => ({ id: row.id, name: row.name });
  const movement = (row) => ({ id: row.id, product: row.product, user: row.user, type: row.type, quantity: row.quantity, reason: row.reason, previousStock: row.previousStock, newStock: row.newStock, createdAt: row.created_at });
  app.get('/api/categories', async (req, res) => res.json((await store.listCategories()).map(category)));
  app.post('/api/categories', admin, async (req, res) => {
    object(req.body);
    const name = text(req.body.name, 'name', 80);
    try {
      const result = await store.insertCategory(name);
      res.status(201).json(category(await store.categoryById(result.lastInsertRowid)));
    } catch (error) {
      if (error.code === 11000) throw new ApiError(409, 'La categoría ya existe.');
      throw error;
    }
  });
  app.delete('/api/categories/:id', admin, async (req, res) => {
    await store.transaction(async (tx) => {
      const row = await tx.categoryById(id(req.params.id));
      if (!row) throw new ApiError(404, 'Categoría no encontrada.');
      if (await tx.categoryInUse(row.name)) throw new ApiError(409, 'La categoría tiene productos asociados.');
      await tx.deleteCategory(row.id);
    });
    res.sendStatus(204);
  });
  app.get('/api/movements', async (req, res) => res.json((await store.listMovements()).map(movement)));
  app.get('/api/movements/product/:id', async (req, res) => {
    const product = await store.productById(id(req.params.id));
    if (!product) throw new ApiError(404, 'Producto no encontrado.');
    res.json({ product: { id: product.id, name: product.name, stock: product.stock }, movements: (await store.listMovements(product.id)).map(movement) });
  });
  app.post('/api/movements', admin, async (req, res) => {
    object(req.body);
    const productId = id(req.body.product);
    const { type, quantity } = req.body;
    if (!['entrada', 'salida'].includes(type)) bad('Tipo de movimiento no válido.');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 2147483647) bad('Cantidad no válida.');
    const reason = text(req.body.reason, 'reason', 300);
    const result = await store.transaction(async (tx) => {
      const user = await tx.userById(req.user.id);
      if (user?.role !== 'admin') throw new ApiError(403, 'Se requiere el rol administrador.');
      const product = await tx.productById(productId);
      if (!product) throw new ApiError(404, 'Producto no encontrado.');
      const stock = product.stock + (type === 'entrada' ? quantity : -quantity);
      if (stock < 0 || stock > 2147483647) throw new ApiError(409, 'El movimiento excede el stock disponible o el máximo permitido.');
      const data = { product: { id: product.id, name: product.name, category: product.category }, user: { id: user.id, name: user.name, username: user.username }, type, quantity, reason, previousStock: product.stock, newStock: stock };
      const inserted = await tx.insertMovement(data);
      await tx.setStock(productId, stock);
      return { ...data, id: inserted.lastInsertRowid };
    });
    res.status(201).json(result);
  });
}
