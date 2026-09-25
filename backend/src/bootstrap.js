import { openDatabase } from './database.js';
import { hashPassword } from './security.js';
import { userInput } from './validation.js';
import { configuration } from './config.js';
const data = userInput({ name: process.env.ADMIN_NAME, username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD, role: 'admin' });
const hash = await hashPassword(data.password);
const db = openDatabase(configuration().databasePath);
try {
  db.exec('BEGIN IMMEDIATE');
  if (db.prepare('SELECT id FROM users LIMIT 1').get()) throw new Error('La base ya contiene usuarios. Utiliza la API con un administrador existente.');
  db.prepare('INSERT INTO users(name, username, password_hash, role) VALUES (?, ?, ?, ?)').run(data.name, data.username, hash, data.role);
  db.exec('COMMIT');
  console.log('Administrador inicial creado. No se imprimen credenciales.');
} catch (error) { db.exec('ROLLBACK'); throw error; }
finally { db.close(); }
