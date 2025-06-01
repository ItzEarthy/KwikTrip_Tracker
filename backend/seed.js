const db = require("./db");

// Create `users` table
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT
  )
`).run();

// Create `visits` table
db.prepare(`
  CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    storeNumber INTEGER NOT NULL,
    visitDate TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
  )
`).run();

console.log("✅ Database initialized with 'users' and 'visits' tables");
