import { createClient } from '@libsql/client';
import { join } from 'path';
import { mkdirSync } from 'fs';

function getLocalDbUrl() {
  const dataDir = join(process.cwd(), 'data');
  mkdirSync(dataDir, { recursive: true });
  return `file:${join(dataDir, 'cookbook.db')}`;
}

const db = createClient({
  url: process.env.TURSO_DB_URL ?? getLocalDbUrl(),
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const ready = (async () => {
  await db.batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS pantry_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        quantity REAL DEFAULT 0,
        unit TEXT DEFAULT '',
        needs_purchase INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        source_url TEXT,
        prep_time TEXT,
        cook_time TEXT,
        yield TEXT,
        ingredient_groups TEXT,
        instructions TEXT,
        equipment TEXT,
        rating INTEGER,
        review TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS cookbooks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS recipe_cookbooks (
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        cookbook_id INTEGER REFERENCES cookbooks(id) ON DELETE CASCADE,
        PRIMARY KEY (recipe_id, cookbook_id)
      )`,
    },
  ], 'write');

  for (const sql of [
    'ALTER TABLE cookbooks ADD COLUMN color TEXT',
    'ALTER TABLE cookbooks ADD COLUMN icon TEXT',
    'ALTER TABLE cookbooks ADD COLUMN pinned_images TEXT',
  ]) {
    try { await db.execute(sql); } catch {}
  }
})();

export default db;
