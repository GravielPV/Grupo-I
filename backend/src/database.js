import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function openDatabase(filename) {
  if (filename !== ':memory:') mkdirSync(dirname(resolve(filename)), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;');
  db.exec('CREATE TABLE IF NOT EXISTS migrations (version INTEGER PRIMARY KEY)');
  if (!db.prepare('SELECT version FROM migrations WHERE version = 1').get()) {
    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec(readFileSync(new URL('../migrations/001_initial.sql', import.meta.url), 'utf8'));
      db.exec('INSERT INTO migrations VALUES (1); COMMIT');
    } catch (error) { db.exec('ROLLBACK'); db.close(); throw error; }
  }
  return db;
}
