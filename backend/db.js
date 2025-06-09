const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DB_FILE = path.join(__dirname, "data", "data.db");

// Ensure the database directory exists
if (!fs.existsSync(path.dirname(DB_FILE))) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
}

// Create or connect to the SQLite database
const db = new Database(DB_FILE);

// --- Create visits table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    storeNumber TEXT NOT NULL,
    visitDate TEXT NOT NULL
  )
`).run();

// --- Create users table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT
  )
`).run();

// --- Add isAdmin column if missing
const hasIsAdmin = db.prepare(`PRAGMA table_info(users)`).all().some(col => col.name === "isAdmin");
if (!hasIsAdmin) {
  db.prepare(`ALTER TABLE users ADD COLUMN isAdmin INTEGER DEFAULT 0`).run();
  console.log("🛠️ Added 'isAdmin' column to users table.");
}

// --- Seed default admin user if missing
const existingAdmin = db.prepare(`SELECT * FROM users WHERE username = 'admin'`).get();
if (!existingAdmin) {
  const hashed = bcrypt.hashSync("admin", 10);
  db.prepare(`
    INSERT INTO users (username, password, nickname, isAdmin)
    VALUES (?, ?, ?, ?)
  `).run("admin", hashed, "Admin", 1);
  console.log("✅ Default admin account created (username: admin, password: admin)");
}

module.exports = db;
