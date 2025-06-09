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

console.log("✅ Database seeded (users + visits tables ready)");
