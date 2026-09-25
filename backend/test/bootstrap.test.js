import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from '../src/database.js';
import { verifyPassword } from '../src/security.js';

test('bootstrap requires credentials, initializes once and never overwrites existing users', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'pharmacy-bootstrap-'));
  const databasePath = join(directory, 'test.sqlite');
  const backendDirectory = fileURLToPath(new URL('..', import.meta.url));
  const run = (password) => spawnSync(process.execPath, ['src/bootstrap.js'], {
    cwd: backendDirectory,
    env: { ...process.env, DATABASE_PATH: databasePath, ADMIN_NAME: 'Initial', ADMIN_USERNAME: 'initial', ADMIN_PASSWORD: password },
    encoding: 'utf8', timeout: 15000,
  });
  try {
    assert.notEqual(run('').status, 0);
    const created = run('bootstrap-test-password');
    assert.equal(created.status, 0, created.stderr);
    assert.ok(!created.stdout.includes('bootstrap-test-password'));
    assert.notEqual(run('different-password').status, 0);
    const db = openDatabase(databasePath);
    try {
      const users = db.prepare('SELECT * FROM users').all();
      assert.equal(users.length, 1);
      assert.equal(users[0].role, 'admin');
      assert.ok(await verifyPassword('bootstrap-test-password', users[0].password_hash));
    } finally { db.close(); }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
