const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "data", "data.db");

// Ensure the database directory exists
if (!fs.existsSync(path.dirname(DB_FILE))) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
}

// Create or connect to the SQLite database
const db = new Database(DB_FILE);

// Example: Create a table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    storeNumber TEXT NOT NULL,
    visitDate TEXT NOT NULL
  )
`).run();

module.exports = db;
