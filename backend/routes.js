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

// --- POST user location (accepts { userId?, latitude, longitude, timestamp? }) ---
router.post("/user-locations", express.json(), (req, res) => {
  const { userId, latitude, longitude, timestamp } = req.body;

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return res.status(400).json({ error: "latitude and longitude are required and must be numbers." });
  }

  const ts = timestamp || new Date().toISOString();
  const stmt = db.prepare(
    "INSERT INTO user_locations (userId, latitude, longitude, timestamp) VALUES (?, ?, ?, ?)"
  );
  const result = stmt.run(userId || null, latitude, longitude, ts);
  res.json({ success: true, id: result.lastInsertRowid });
});

// --- GET user locations (optionally filter by `userId`, provide `limit`) ---
router.get("/user-locations", (req, res) => {
  const { userId, limit } = req.query;
  let q = "SELECT id, userId, latitude, longitude, timestamp FROM user_locations";
  const params = [];
  if (userId) {
    q += " WHERE userId = ?";
    params.push(userId);
  }
  q += " ORDER BY timestamp DESC";
  if (limit) {
    q += " LIMIT ?";
    params.push(parseInt(limit, 10) || 100);
  }

  const stmt = db.prepare(q);
  const rows = params.length ? stmt.all(...params) : stmt.all();
  res.json(rows);
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

// --- Admin: GET recent user locations ---
router.get("/admin/user-locations", requireAdmin, (req, res) => {
  const rows = db
    .prepare("SELECT id, userId, latitude, longitude, timestamp FROM user_locations ORDER BY timestamp DESC LIMIT 1000")
    .all();
  res.json(rows);
});

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

// ============================================
// FRIEND MANAGEMENT ROUTES
// ============================================

// --- GET friends for a user ---
router.get("/friends/:userId", (req, res) => {
  const { userId } = req.params;
  
  const friends = db.prepare(`
    SELECT 
      u.id, 
      u.nickname,
      f.status,
      f.requestedAt,
      f.id as friendshipId
    FROM friends f
    JOIN users u ON (
      (f.userId = ? AND u.id = f.friendId) OR 
      (f.friendId = ? AND u.id = f.userId)
    )
    WHERE (f.userId = ? OR f.friendId = ?) AND f.status = 'accepted'
  `).all(userId, userId, userId, userId);
  
  res.json(friends);
});

// --- GET pending friend requests (incoming) ---
router.get("/friend-requests/:userId", (req, res) => {
  const { userId } = req.params;
  
  const requests = db.prepare(`
    SELECT 
      u.id, 
      u.nickname,
      f.requestedAt,
      f.id as friendshipId
    FROM friends f
    JOIN users u ON u.id = f.userId
    WHERE f.friendId = ? AND f.status = 'pending'
  `).all(userId);
  
  res.json(requests);
});

// --- GET sent friend requests (outgoing) ---
router.get("/friend-requests-sent/:userId", (req, res) => {
  const { userId } = req.params;
  
  const requests = db.prepare(`
    SELECT 
      u.id, 
      u.nickname,
      f.requestedAt,
      f.id as friendshipId
    FROM friends f
    JOIN users u ON u.id = f.friendId
    WHERE f.userId = ? AND f.status = 'pending'
  `).all(userId);
  
  res.json(requests);
});

// --- POST send friend request ---
router.post("/friend-request", express.json(), (req, res) => {
  const { userId, friendId } = req.body;
  
  if (!userId || !friendId) {
    return res.status(400).json({ error: "userId and friendId are required." });
  }
  
  if (userId === friendId) {
    return res.status(400).json({ error: "Cannot add yourself as a friend." });
  }
  
  // Check if friendship already exists
  const existing = db.prepare(
    "SELECT * FROM friends WHERE (userId = ? AND friendId = ?) OR (userId = ? AND friendId = ?)"
  ).get(userId, friendId, friendId, userId);
  
  if (existing) {
    return res.status(400).json({ error: "Friend request already exists." });
  }
  
  const result = db.prepare(
    "INSERT INTO friends (userId, friendId, status, requestedAt) VALUES (?, ?, 'pending', ?)"
  ).run(userId, friendId, new Date().toISOString());
  
  res.json({ success: true, id: result.lastInsertRowid });
});

// --- PUT accept/decline friend request ---
router.put("/friend-request/:id", express.json(), (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'accept' or 'decline'
  
  if (action === 'accept') {
    const result = db.prepare(
      "UPDATE friends SET status = 'accepted' WHERE id = ?"
    ).run(id);
    res.json({ success: result.changes > 0 });
  } else if (action === 'decline') {
    const result = db.prepare("DELETE FROM friends WHERE id = ?").run(id);
    res.json({ success: result.changes > 0 });
  } else {
    res.status(400).json({ error: "Invalid action. Use 'accept' or 'decline'." });
  }
});

// --- DELETE remove friend ---
router.delete("/friends/:friendshipId", (req, res) => {
  const { friendshipId } = req.params;
  
  const result = db.prepare("DELETE FROM friends WHERE id = ?").run(friendshipId);
  res.json({ success: result.changes > 0 });
});

// --- GET search users (exclude self and existing friends) ---
router.get("/users/search/:userId", (req, res) => {
  const { userId } = req.params;
  const { query } = req.query;
  
  let sql = `
    SELECT u.id, u.nickname 
    FROM users u
    WHERE u.id != ?
  `;
  
  const params = [userId];
  
  if (query) {
    sql += " AND (u.nickname LIKE ? OR u.username LIKE ?)";
    params.push(`%${query}%`, `%${query}%`);
  }
  
  sql += " LIMIT 20";
  
  const users = db.prepare(sql).all(...params);
  
  // Filter out existing friends/requests
  const existingFriends = db.prepare(`
    SELECT friendId as id FROM friends WHERE userId = ?
    UNION
    SELECT userId as id FROM friends WHERE friendId = ?
  `).all(userId, userId).map(f => f.id);
  
  const filtered = users.filter(u => !existingFriends.includes(u.id));
  
  res.json(filtered);
});

module.exports = router;
