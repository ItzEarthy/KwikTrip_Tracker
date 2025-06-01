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

module.exports = router;
