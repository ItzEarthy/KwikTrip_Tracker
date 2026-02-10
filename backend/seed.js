const db = require('./db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT
  )
`).run();

// Check if 'isAdmin' column exists, and add it if not
const hasIsAdmin = db.prepare(`
  PRAGMA table_info(users)
`).all().some(col => col.name === "isAdmin");

if (!hasIsAdmin) {
  db.prepare(`ALTER TABLE users ADD COLUMN isAdmin INTEGER DEFAULT 0`).run();
  console.log("🛠️ Added 'isAdmin' column to users table.");
}


db.prepare(`
  CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    storeNumber INTEGER NOT NULL,
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
  )
`).run();

// Check if app_settings table exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL
  )
`).run();

// Seed default app_settings
const maxPhotosExists = db.prepare(`SELECT * FROM app_settings WHERE key = 'max_photos'`).get();
if (!maxPhotosExists) {
  db.prepare(`INSERT INTO app_settings (key, value) VALUES (?, ?)`).run('max_photos', '3');
  console.log("✅ Seeded app_settings: max_photos = 3");
}

const allowPhotosExists = db.prepare(`SELECT * FROM app_settings WHERE key = 'allow_photos'`).get();
if (!allowPhotosExists) {
  db.prepare(`INSERT INTO app_settings (key, value) VALUES (?, ?)`).run('allow_photos', '1');
  console.log("✅ Seeded app_settings: allow_photos = 1");
}

console.log("✅ Database seeded (users + visits tables ready)");
