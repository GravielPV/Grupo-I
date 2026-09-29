import { openMongoDatabase } from './mongo-store.js';

export async function connectDatabase(config) {
  if (config.databaseDriver === 'mongodb') return openMongoDatabase(config);
  const { openDatabase } = await import('./database.js');
  const { sqliteStore } = await import('./sqlite-store.js');
  const db = openDatabase(config.databasePath);
  return { ...sqliteStore(db), close: () => db.close() };
}
