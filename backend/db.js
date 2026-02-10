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

// --- Create user_locations table if not exists (for storing user geolocation pings)
db.prepare(`
  CREATE TABLE IF NOT EXISTS user_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    timestamp TEXT NOT NULL
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

// --- Create friends table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    friendId INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    requestedAt TEXT NOT NULL,
    UNIQUE(userId, friendId)
  )
`).run();

// --- Create reviews table if not exists
// Ratings are nullable; checks allow NULL or a value between 1 and 5
db.prepare(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    storeNumber TEXT NOT NULL,
    comment TEXT,
    ratingOverall INTEGER CHECK(ratingOverall IS NULL OR (ratingOverall >= 1 AND ratingOverall <= 5)),
    ratingClean INTEGER CHECK(ratingClean IS NULL OR (ratingClean >= 1 AND ratingClean <= 5)),
    ratingStaff INTEGER CHECK(ratingStaff IS NULL OR (ratingStaff >= 1 AND ratingStaff <= 5)),
    ratingHotspot INTEGER CHECK(ratingHotspot IS NULL OR (ratingHotspot >= 1 AND ratingHotspot <= 5)),
    ratingBathroom INTEGER CHECK(ratingBathroom IS NULL OR (ratingBathroom >= 1 AND ratingBathroom <= 5)),
    ratingVibe INTEGER CHECK(ratingVibe IS NULL OR (ratingVibe >= 1 AND ratingVibe <= 5)),
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visitId) REFERENCES visits(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(visitId)
  )
`).run();

// --- Create photos table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reviewId INTEGER NOT NULL,
    filePath TEXT NOT NULL,
    uploadedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reviewId) REFERENCES reviews(id) ON DELETE CASCADE
  )
`).run();

// --- Create app_settings table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL
  )
`).run();

// --- Seed default app_settings if missing
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

module.exports = db;
