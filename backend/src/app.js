import express from 'express';
import { hashPassword, verifyPassword, newToken, tokenHash } from './security.js';
import { ApiError, bad, object, text, userInput, productInput, id } from './validation.js';

const publicUser = (row) => ({ id: row.id, name: row.name, username: row.username, role: row.role, createdAt: row.created_at });
const dayNumber = (date) => Date.parse(`${date}T00:00:00Z`) / 86400000;
export function businessDate(now, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (key) => parts.find((p) => p.type === key).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export async function createApp({ db, origins = ['http://localhost:5173'], timeZone = 'America/La_Paz', sessionHours = 8, now = () => new Date() }) {
  const app = express();
  const dummyHash = await hashPassword(newToken());
  const attempts = new Map();
  const today = () => businessDate(now(), timeZone);
  const product = (row) => {
    const days = dayNumber(row.expiration_date) - dayNumber(today());
    return { id: row.id, name: row.name, category: row.category, price: row.price_cents / 100,
      stock: row.stock, expirationDate: row.expiration_date, createdAt: row.created_at, updatedAt: row.updated_at,
      lowStock: row.stock <= 5, daysUntilExpiration: days, expired: days < 0,
      expiringSoon: days >= 0 && days < 30, availableForSale: days >= 0 && row.stock > 0 };
  };
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Cache-Control': 'no-store' });
    const origin = req.get('Origin');
    res.vary('Origin');
    if (origin) {
      if (!origins.includes(origin)) return next(new ApiError(403, 'Origen no permitido.'));
      res.set('Access-Control-Allow-Origin', origin);
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/health', (req, res) => { db.prepare('SELECT 1').get(); res.json({ status: 'ok' }); });
  app.post('/api/auth/login', async (req, res) => {
    // Limit by client IP before password hashing. Expired entries are removed and storage is bounded.
    const timestamp = now().getTime();
    for (const [key, value] of attempts) if (value.reset <= timestamp) attempts.delete(key);
    const key = req.ip;
    const attempt = attempts.get(key) ?? { count: 0, reset: timestamp + 15 * 60000 };
    if (attempt.count >= 20 || (!attempts.has(key) && attempts.size >= 10000)) {
      res.set('Retry-After', '900');
      throw new ApiError(429, 'Demasiados intentos. Intenta nuevamente más tarde.');
    }
    attempt.count++;
    attempts.set(key, attempt);
    object(req.body);
    const username = text(req.body.username, 'username', 80).toLowerCase();
    if (typeof req.body.password !== 'string' || !req.body.password || Buffer.byteLength(req.body.password) > 256) bad('Credenciales no válidas.');
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    const valid = await verifyPassword(req.body.password, user?.password_hash ?? dummyHash);
    if (!user || !valid) throw new ApiError(401, 'Usuario o contraseña incorrectos.');
    // Recheck after asynchronous hashing: deleted/edited accounts must never gain a new session.
    const current = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    if (!current || current.password_hash !== user.password_hash) throw new ApiError(401, 'Usuario o contraseña incorrectos.');
    const token = newToken();
    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(timestamp);
    db.prepare('INSERT INTO sessions(token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(tokenHash(token), current.id, timestamp + sessionHours * 3600000);
    res.json({ token, user: publicUser(current) });
  });
  app.use('/api', (req, res, next) => {
    const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.get('Authorization') ?? '');
    if (!match) return next(new ApiError(401, 'Debes iniciar sesión.'));
    req.tokenHash = tokenHash(match[1]);
    req.user = db.prepare('SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE token_hash = ? AND expires_at > ?').get(req.tokenHash, now().getTime());
    if (!req.user) return next(new ApiError(401, 'Sesión inválida o vencida.'));
    next();
  });
  const admin = (req, res, next) => req.user.role === 'admin' ? next() : next(new ApiError(403, 'Se requiere el rol administrador.'));
  app.get('/api/auth/me', (req, res) => res.json(publicUser(req.user)));
  app.post('/api/auth/logout', (req, res) => {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(req.tokenHash);
    res.sendStatus(204);
  });
  app.get('/api/users', admin, (req, res) => res.json(db.prepare('SELECT * FROM users ORDER BY id').all().map(publicUser)));
  app.post('/api/users', admin, async (req, res) => {
    const data = userInput(req.body);
    const hash = await hashPassword(data.password);
    const acting = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.id);
    if (acting?.role !== 'admin') throw new ApiError(403, 'Se requiere el rol administrador.');
    const result = db.prepare('INSERT INTO users(name, username, password_hash, role) VALUES (?, ?, ?, ?)').run(data.name, data.username, hash, data.role);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(publicUser(user));
  });
  const findUser = (value) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id(value));
    if (!user) throw new ApiError(404, 'Usuario no encontrado.');
    return user;
  };
  const protectLastAdmin = (user) => {
    if (user.role === 'admin' && db.prepare("SELECT count(*) AS total FROM users WHERE role = 'admin'").get().total <= 1) {
      throw new ApiError(409, 'No se puede eliminar ni degradar al último administrador.');
    }
  };
  app.put('/api/users/:id', admin, async (req, res) => {
    id(req.params.id);
    const data = userInput(req.body, true);
    const hash = data.password === undefined ? undefined : await hashPassword(data.password);
    const acting = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.id);
    if (acting?.role !== 'admin') throw new ApiError(403, 'Se requiere el rol administrador.');
    db.exec('BEGIN IMMEDIATE');
    try {
      const user = findUser(req.params.id);
      if (data.role !== 'admin') protectLastAdmin(user);
      db.prepare('UPDATE users SET name = ?, username = ?, role = ?, password_hash = ? WHERE id = ?').run(data.name, data.username, data.role, hash ?? user.password_hash, user.id);
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
      db.exec('COMMIT');
      res.json(publicUser(findUser(req.params.id)));
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  });
  app.delete('/api/users/:id', admin, (req, res) => {
    db.exec('BEGIN IMMEDIATE');
    try {
      const user = findUser(req.params.id);
      protectLastAdmin(user);
      db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
      db.exec('COMMIT');
      res.sendStatus(204);
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  });
  app.get('/api/products', (req, res) => {
    const { search, category, lowStock, expiringSoon, expired } = req.query;
    for (const [key, value] of Object.entries(req.query)) {
      if (!['search', 'category', 'lowStock', 'expiringSoon', 'expired'].includes(key) || typeof value !== 'string') bad('Filtro no válido.');
    }
    for (const value of [lowStock, expiringSoon, expired]) if (value !== undefined && !['true', 'false'].includes(value)) bad('Los filtros booleanos deben ser true o false.');
    if (expiringSoon !== undefined && req.user.role !== 'admin') throw new ApiError(403, 'El filtro de próximos vencimientos es para administradores.');
    if ((search?.length ?? 0) > 120 || (category?.length ?? 0) > 80) bad('Filtro demasiado largo.');
    let products = db.prepare('SELECT * FROM products ORDER BY id DESC').all().map(product);
    if (search) products = products.filter((p) => p.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) || p.category.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
    if (category) products = products.filter((p) => p.category.toLocaleLowerCase() === category.trim().toLocaleLowerCase());
    for (const [field, value] of Object.entries({ lowStock, expiringSoon, expired })) {
      if (value !== undefined) products = products.filter((p) => p[field] === (value === 'true'));
    }
    if (expiringSoon === 'true') products.sort((a, b) => a.expirationDate.localeCompare(b.expirationDate) || a.id - b.id);
    res.json(products);
  });
  const findProduct = (value) => {
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id(value));
    if (!row) throw new ApiError(404, 'Producto no encontrado.');
    return row;
  };
  app.get('/api/products/:id', (req, res) => res.json(product(findProduct(req.params.id))));
  app.post('/api/products', admin, (req, res) => {
    const data = productInput(req.body, today());
    const result = db.prepare('INSERT INTO products(name, category, price_cents, stock, expiration_date) VALUES (?, ?, ?, ?, ?)').run(data.name, data.category, data.cents, data.stock, data.expirationDate);
    res.status(201).location(`/api/products/${result.lastInsertRowid}`).json(product(findProduct(String(result.lastInsertRowid))));
  });
  app.put('/api/products/:id', admin, (req, res) => {
    const row = findProduct(req.params.id);
    const data = productInput(req.body, today());
    db.prepare("UPDATE products SET name = ?, category = ?, price_cents = ?, stock = ?, expiration_date = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?").run(data.name, data.category, data.cents, data.stock, data.expirationDate, row.id);
    res.json(product(findProduct(req.params.id)));
  });
  app.delete('/api/products/:id', admin, (req, res) => {
    const row = findProduct(req.params.id);
    db.prepare('DELETE FROM products WHERE id = ?').run(row.id);
    res.sendStatus(204);
  });
  app.use((req, res, next) => next(new ApiError(404, 'Ruta no encontrada.')));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof ApiError) return res.status(error.status).json({ message: error.message, ...(error.errors ? { errors: error.errors } : {}) });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'JSON no válido.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ message: 'Solicitud demasiado grande.' });
    if (error.code === 'ERR_SQLITE_ERROR' && error.errcode === 2067) return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
    console.error('Error interno de API:', error.code ?? error.name);
    res.status(500).json({ message: 'Error interno del servidor.' });
  });
  return app;
}
