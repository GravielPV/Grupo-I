import { connectDatabase } from './connect.js';
import { hashPassword } from './security.js';
import { userInput } from './validation.js';
import { configuration } from './config.js';

let store;
try {
  const data = userInput({ name: process.env.ADMIN_NAME, username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD, role: 'admin' });
  const hash = await hashPassword(data.password);
  store = await connectDatabase(configuration());
  await store.transaction(async (tx) => {
    if ((await tx.listUsers()).length) throw new Error('La base ya contiene usuarios. Utiliza un administrador existente.');
    await tx.insertUser(data.name, data.username, hash, data.role);
  });
  console.log('Administrador inicial creado.');
} catch (error) {
  console.error(error.name === 'MongoServerError' || error.name?.startsWith('Mongo') ? 'No se pudo inicializar Atlas. Revisa conexión y permisos.' : error.message);
  process.exitCode = 1;
} finally { if (store) await store.close(); }
