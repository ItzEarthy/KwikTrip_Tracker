const express = require("express");
const router = express.Router();
const db = require("./db");
const fs = require("fs");

// Load static location data
const locations = JSON.parse(fs.readFileSync("locations.json"));

// --- GET all locations ---
router.get("/locations", (req, res) => {
  res.json(locations);
});

// --- GET visits for a user ---
router.get("/visits/:userId", (req, res) => {
  const { userId } = req.params;
  const visits = db
    .prepare(
      `
      SELECT visits.storeNumber, visits.visitDate, users.nickname
      FROM visits
      JOIN users ON users.id = visits.userId
      WHERE visits.userId = ?
      ORDER BY visits.visitDate DESC
    `
    )
    .all(userId);
  res.json(visits);
});

// --- POST a new visit ---
router.post("/visits", express.json(), (req, res) => {
  const { userId, storeNumber } = req.body;
  const visitDate = req.body.visitDate || new Date().toISOString();
  const stmt = db.prepare(
    "INSERT INTO visits (userId, storeNumber, visitDate) VALUES (?, ?, ?)"
  );
  const result = stmt.run(userId, storeNumber, visitDate);
  res.json({ success: true, id: result.lastInsertRowid });
});

// --- POST /register ---
router.post("/register", express.json(), (req, res) => {
  const { username, password, nickname } = req.body;

  const exists = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(username);

  if (exists) {
    return res.status(400).json({ error: "Username already exists." });
  }

  const result = db
    .prepare(
      "INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)"
    )
    .run(username, password, nickname);

  res.json({ id: result.lastInsertRowid, nickname });
});

// --- POST /login ---
router.post("/login", express.json(), (req, res) => {
  const { username, password } = req.body;

  const user = db
    .prepare(
      "SELECT id, nickname FROM users WHERE username = ? AND password = ?"
    )
    .get(username, password);

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  res.json(user);
});

// --- GET all users ---
router.get("/users", (req, res) => {
  const users = db.prepare("SELECT id, nickname FROM users").all();
  res.json(users);
});

// --- GET visits for all users ---
router.get("/visits", (req, res) => {
  const visits = db
    .prepare(
      `
      SELECT visits.userId, users.nickname, COUNT(*) as visitCount
      FROM visits
      JOIN users ON users.id = visits.userId
      GROUP BY visits.userId
    `
    )
    .all();
  res.json(visits);
});

// --- GET visits for a specific user ---
router.get("/visits/:userId", (req, res) => {
  const { userId } = req.params;
  const visits = db
    .prepare(
      `
      SELECT storeNumber, visitDate
      FROM visits
      WHERE userId = ?
      ORDER BY visitDate DESC
    `
    )
    .all(userId);
  res.json(visits);
});

// --- GET user stats ---
router.get("/stats/:userId", (req, res) => {
  const { userId } = req.params;

  const totalLocations = locations.length;
  const visitedLocations = db
    .prepare("SELECT COUNT(*) as count FROM visits WHERE userId = ?")
    .get(userId).count;

  const percentVisited = totalLocations
    ? Math.round((visitedLocations / totalLocations) * 100)
    : 0;

  res.json({
    total: totalLocations,
    visited: visitedLocations,
    percent: percentVisited,
  });
});

// --- Delete a visit ---
router.delete("/visits/:userId/:storeNumber", (req, res) => {
  const { userId, storeNumber } = req.params;
  const stmt = db.prepare(
    "DELETE FROM visits WHERE userId = ? AND storeNumber = ?"
  );
  stmt.run(userId, storeNumber);
  res.json({ success: true });
});

// PUT /api/users/:id/nickname
// --- PUT /users/:id/nickname ---
router.put("/users/:id/nickname", express.json(), (req, res) => {
  const { id } = req.params;
  const { nickname } = req.body;

  if (!nickname) {
    return res.status(400).json({ error: "Nickname is required." });
  }

  const stmt = db.prepare("UPDATE users SET nickname = ? WHERE id = ?");
  const result = stmt.run(nickname, id);

  res.json({ success: result.changes > 0 });
});

// --- POST /users/:id/reset-password ---
router.post("/users/:id/reset-password", express.json(), (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const stmt = db.prepare("UPDATE users SET password = ? WHERE id = ?");
  const result = stmt.run(newPassword, id); // 🔒 Note: In production, hash the password.

  res.json({ success: result.changes > 0 });
});


module.exports = router;
