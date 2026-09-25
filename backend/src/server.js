import { openDatabase } from './database.js';
import { createApp } from './app.js';
import { configuration } from './config.js';
const config = configuration();
const db = openDatabase(config.databasePath);
const app = await createApp({ ...config, db });
const server = app.listen(config.port, config.host, () => console.log(`Pharmacy API: http://${config.host}:${config.port}/api`));
server.on('error', (error) => { console.error(error.message); db.close(); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  server.close(() => { db.close(); process.exit(0); });
});
