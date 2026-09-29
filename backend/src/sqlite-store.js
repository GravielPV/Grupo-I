export function sqliteStore(db) {
  return {
    health: (...args) => db.prepare('SELECT 1').get(...args),
    userByUsername: (...args) => db.prepare('SELECT * FROM users WHERE username = ?').get(...args),
    userById: (...args) => db.prepare('SELECT * FROM users WHERE id = ?').get(...args),
    purgeSessions: (...args) => db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(...args),
    createSession: (...args) => db.prepare('INSERT INTO sessions(token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(...args),
    sessionUser: (...args) => db.prepare('SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE token_hash = ? AND expires_at > ?').get(...args),
    deleteSession: (...args) => db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(...args),
    listUsers: (...args) => db.prepare('SELECT * FROM users ORDER BY id').all(...args),
    userRole: (...args) => db.prepare('SELECT role FROM users WHERE id = ?').get(...args),
    insertUser: (...args) => db.prepare('INSERT INTO users(name, username, password_hash, role) VALUES (?, ?, ?, ?)').run(...args),
    adminCount: (...args) => db.prepare("SELECT count(*) AS total FROM users WHERE role = 'admin'").get(...args),
    updateUser: (...args) => db.prepare('UPDATE users SET name = ?, username = ?, role = ?, password_hash = ? WHERE id = ?').run(...args),
    revokeSessions: (...args) => db.prepare('DELETE FROM sessions WHERE user_id = ?').run(...args),
    deleteUser: (...args) => db.prepare('DELETE FROM users WHERE id = ?').run(...args),
    listProducts: (...args) => db.prepare('SELECT * FROM products ORDER BY id DESC').all(...args),
    productById: (...args) => db.prepare('SELECT * FROM products WHERE id = ?').get(...args),
    insertProduct: (...args) => db.prepare('INSERT INTO products(name, category, price_cents, stock, expiration_date) VALUES (?, ?, ?, ?, ?)').run(...args),
    updateProduct: (...args) => db.prepare("UPDATE products SET name = ?, category = ?, price_cents = ?, stock = ?, expiration_date = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?").run(...args),
    deleteProduct: (...args) => db.prepare('DELETE FROM products WHERE id = ?').run(...args),
    async transaction(work) {
      db.exec('BEGIN IMMEDIATE');
      try { const result = await work(this); db.exec('COMMIT'); return result; }
      catch (error) { db.exec('ROLLBACK'); throw error; }
    },
  };
}
