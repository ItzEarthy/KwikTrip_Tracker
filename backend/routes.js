const express = require("express");
const router = express.Router();
const db = require("./db");
const fs = require("fs");
const bcrypt = require("bcryptjs");

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
router.post("/register", express.json(), async (req, res) => {
  const { username, password, nickname } = req.body;

  const exists = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(username);
  if (exists) {
    return res.status(400).json({ error: "Username already exists." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = db
    .prepare(
      "INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)"
    )
    .run(username, hashedPassword, nickname);

  res.json({ id: result.lastInsertRowid, nickname });
});

// --- POST /login ---
router.post("/login", express.json(), (req, res) => {
  const { username, password } = req.body;

  const user = db
    .prepare(
      "SELECT id, nickname, password, isAdmin FROM users WHERE username = ?"
    )
    .get(username);

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const match = bcrypt.compareSync(password, user.password);
  if (!match) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  res.json({ id: user.id, nickname: user.nickname, isAdmin: user.isAdmin });
});

// --- GET all users ---
router.get("/users", (req, res) => {
  const users = db.prepare("SELECT id, nickname FROM users").all();
  res.json(users);
});

// --- GET visits summary for all users ---
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

// --- GET user stats ---
router.get("/stats/:userId", (req, res) => {
  const { userId } = req.params;
  const total = locations.length;
  const visited = db
    .prepare("SELECT COUNT(*) as count FROM visits WHERE userId = ?")
    .get(userId).count;
  const percent = total ? Math.round((visited / total) * 100) : 0;
  res.json({ total, visited, percent });
});

// --- DELETE a visit ---
router.delete("/visits/:userId/:storeNumber", (req, res) => {
  const { userId, storeNumber } = req.params;
  const stmt = db.prepare(
    "DELETE FROM visits WHERE userId = ? AND storeNumber = ?"
  );
  stmt.run(userId, storeNumber);
  res.json({ success: true });
});

// --- PUT /users/:id/nickname ---
router.put("/users/:id/nickname", express.json(), (req, res) => {
  const { id } = req.params;
  const { nickname } = req.body;

  if (!nickname) {
    return res.status(400).json({ error: "Nickname is required." });
  }

  const result = db
    .prepare("UPDATE users SET nickname = ? WHERE id = ?")
    .run(nickname, id);
  res.json({ success: result.changes > 0 });
});

// --- POST /users/:id/reset-password (secure) ---
router.post("/users/:id/reset-password", express.json(), (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters." });
  }

  const hashed = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashed, id);

  res.json({ success: true });
});

// --- Middleware to check admin status ---
function requireAdmin(req, res, next) {
  const { userId } = req.query;
  const user = db.prepare("SELECT isAdmin FROM users WHERE id = ?").get(userId);
  if (!user || user.isAdmin !== 1) {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}

// --- GET all users (admin only) ---
router.get("/admin/users", requireAdmin, (req, res) => {
  const users = db
    .prepare("SELECT id, username, nickname, isAdmin FROM users")
    .all();
  res.json(users);
});

// --- PUT promote/demote user ---
router.put(
  "/admin/users/:id/role",
  express.json(),
  requireAdmin,
  (req, res) => {
    const { id } = req.params;
    const { isAdmin } = req.body;
    const result = db
      .prepare("UPDATE users SET isAdmin = ? WHERE id = ?")
      .run(isAdmin ? 1 : 0, id);
    res.json({ success: result.changes > 0 });
  }
);

// PUT /admin/users/:id/username
router.put("/admin/users/:id/username", express.json(), requireAdmin, (req, res) => {
  const { id } = req.params;
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username is required." });

  const result = db.prepare("UPDATE users SET username = ? WHERE id = ?").run(username, id);
  res.json({ success: result.changes > 0 });
});

// POST /admin/users/:id/password
router.post("/admin/users/:id/password", express.json(), requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  const result = db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashed, id);
  res.json({ success: result.changes > 0 });
});

// GET /users/:id/is-admin
router.get("/users/:id/is-admin", (req, res) => {
  const { id } = req.params;
  const user = db.prepare("SELECT isAdmin FROM users WHERE id = ?").get(id);

  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  res.json({ isAdmin: !!user.isAdmin });
});

// --- DELETE user ---
router.delete("/admin/users/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const result = db.prepare("DELETE FROM users WHERE id = ?").run(id);
  res.json({ success: result.changes > 0 });
});

module.exports = router;
