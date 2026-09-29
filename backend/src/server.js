import { connectDatabase } from './connect.js';
import { createApp } from './app.js';
import { configuration } from './config.js';

let store;
try {
  const config = configuration();
  store = await connectDatabase(config);
  const app = await createApp({ ...config, store });
  const server = app.listen(config.port, config.host, () => console.log(`Pharmacy API: http://${config.host}:${config.port}/api (${config.databaseDriver})`));
  server.on('error', async () => { console.error('No se pudo abrir el puerto HTTP.'); await store.close(); process.exitCode = 1; });
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
    const timeout = setTimeout(() => process.exit(1), 10000).unref();
    server.close(async () => { await store.close(); clearTimeout(timeout); });
  });
} catch (error) {
  console.error('No se pudo iniciar la API. Revisa la configuración, el usuario y el acceso de red de Atlas.', error.code ?? error.name);
  if (store) await store.close();
  process.exitCode = 1;
}
