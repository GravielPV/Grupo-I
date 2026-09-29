import { configuration } from './config.js';
import { connectDatabase } from './connect.js';

let store;
try {
  const config = configuration();
  store = await connectDatabase(config);
  await store.health();
  console.log(`Conexión correcta: ${config.databaseDriver}, base ${config.mongoDatabase}.`);
} catch (error) {
  console.error('No se pudo conectar. Comprueba MONGODB_URI, Database Access y Network Access en Atlas.', error.code ?? error.name);
  process.exitCode = 1;
} finally { if (store) await store.close(); }
