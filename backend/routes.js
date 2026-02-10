const express = require("express");
const router = express.Router();
const db = require("./db");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  }
});

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
      SELECT visits.id, visits.storeNumber, visits.visitDate, users.nickname
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

// ============================================
// REVIEW & PHOTO ROUTES
// ============================================

// --- POST /visits/:id/review (Add or update review with optional photos) ---
router.post("/visits/:id/review", upload.array("photos", 10), async (req, res) => {
  const { id: visitId } = req.params;
  const { userId, storeNumber, comment, ratingOverall, ratingClean, ratingStaff, ratingHotspot, ratingBathroom, ratingVibe } = req.body;

  try {
    // Check if visit exists
    const visit = db.prepare("SELECT * FROM visits WHERE id = ?").get(visitId);
    if (!visit) {
      return res.status(404).json({ error: "Visit not found." });
    }

    // Verify the visit belongs to this user
    if (visit.userId != userId) {
      return res.status(403).json({ error: "Unauthorized." });
    }

    // Check app settings for photo uploads
    const allowPhotosSettings = db.prepare("SELECT value FROM app_settings WHERE key = 'allow_photos'").get();
    const maxPhotosSettings = db.prepare("SELECT value FROM app_settings WHERE key = 'max_photos'").get();
    
    const allowPhotos = allowPhotosSettings ? parseInt(allowPhotosSettings.value) === 1 : true;
    const maxPhotos = maxPhotosSettings ? parseInt(maxPhotosSettings.value) : 3;

    if (!allowPhotos && req.files && req.files.length > 0) {
      // Delete uploaded files if photos are not allowed
      req.files.forEach(file => fs.unlinkSync(file.path));
      return res.status(400).json({ error: "Photo uploads are currently disabled." });
    }

    // Check if review already exists for this visit
    const existingReview = db.prepare("SELECT id FROM reviews WHERE visitId = ?").get(visitId);

    let reviewId;
    if (existingReview) {
      // Update existing review
      db.prepare(`
        UPDATE reviews 
        SET comment = ?, ratingOverall = ?, ratingClean = ?, ratingStaff = ?, 
            ratingHotspot = ?, ratingBathroom = ?, ratingVibe = ?, createdAt = ?
        WHERE visitId = ?
      `).run(
        comment || null,
        ratingOverall || null,
        ratingClean || null,
        ratingStaff || null,
        ratingHotspot || null,
        ratingBathroom || null,
        ratingVibe || null,
        new Date().toISOString(),
        visitId
      );
      reviewId = existingReview.id;
    } else {
      // Create new review
      const result = db.prepare(`
        INSERT INTO reviews (visitId, userId, storeNumber, comment, ratingOverall, ratingClean, 
                            ratingStaff, ratingHotspot, ratingBathroom, ratingVibe, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        visitId,
        userId,
        storeNumber,
        comment || null,
        ratingOverall || null,
        ratingClean || null,
        ratingStaff || null,
        ratingHotspot || null,
        ratingBathroom || null,
        ratingVibe || null,
        new Date().toISOString()
      );
      reviewId = result.lastInsertRowid;
    }

    // Handle photo uploads
    if (req.files && req.files.length > 0) {
      // Check existing photo count
      const existingPhotoCount = db.prepare("SELECT COUNT(*) as count FROM photos WHERE reviewId = ?").get(reviewId).count;
      const availableSlots = maxPhotos - existingPhotoCount;

      if (availableSlots <= 0) {
        // Delete all uploaded files
        req.files.forEach(file => fs.unlinkSync(file.path));
        return res.status(400).json({ error: `Maximum of ${maxPhotos} photos allowed per review.` });
      }

      const photosToSave = req.files.slice(0, availableSlots);
      const photosToDelete = req.files.slice(availableSlots);

      // Delete excess files
      photosToDelete.forEach(file => fs.unlinkSync(file.path));

      // Save photo records
      const photoInsert = db.prepare(`
        INSERT INTO photos (reviewId, filePath, uploadedAt)
        VALUES (?, ?, ?)
      `);

      photosToSave.forEach(file => {
        photoInsert.run(reviewId, file.filename, new Date().toISOString());
      });
    }

    res.json({ success: true, reviewId });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    console.error("Error creating review:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- GET /locations/:storeNumber/stats (Public average ratings) ---
router.get("/locations/:storeNumber/stats", (req, res) => {
  const { storeNumber } = req.params;

  const stats = db.prepare(`
    SELECT 
      COUNT(*) as totalReviews,
      AVG(ratingOverall) as avgOverall,
      AVG(ratingClean) as avgClean,
      AVG(ratingStaff) as avgStaff,
      AVG(ratingHotspot) as avgHotspot,
      AVG(ratingBathroom) as avgBathroom,
      AVG(ratingVibe) as avgVibe
    FROM reviews
    WHERE storeNumber = ? AND (
      ratingOverall IS NOT NULL OR
      ratingClean IS NOT NULL OR
      ratingStaff IS NOT NULL OR
      ratingHotspot IS NOT NULL OR
      ratingBathroom IS NOT NULL OR
      ratingVibe IS NOT NULL
    )
  `).get(storeNumber);

  res.json({
    storeNumber,
    totalReviews: stats.totalReviews || 0,
    ratings: {
      overall: stats.avgOverall ? parseFloat(stats.avgOverall.toFixed(2)) : null,
      clean: stats.avgClean ? parseFloat(stats.avgClean.toFixed(2)) : null,
      staff: stats.avgStaff ? parseFloat(stats.avgStaff.toFixed(2)) : null,
      hotspot: stats.avgHotspot ? parseFloat(stats.avgHotspot.toFixed(2)) : null,
      bathroom: stats.avgBathroom ? parseFloat(stats.avgBathroom.toFixed(2)) : null,
      vibe: stats.avgVibe ? parseFloat(stats.avgVibe.toFixed(2)) : null
    }
  });
});

// --- GET /locations/:storeNumber/activity (Timeline of reviews with privacy) ---
router.get("/locations/:storeNumber/activity", (req, res) => {
  const { storeNumber } = req.params;
  const { requesterId } = req.query; // User requesting the data

  // Get all reviews for this location
  const reviews = db.prepare(`
    SELECT 
      r.id,
      r.visitId,
      r.userId,
      r.comment,
      r.ratingOverall,
      r.ratingClean,
      r.ratingStaff,
      r.ratingHotspot,
      r.ratingBathroom,
      r.ratingVibe,
      r.createdAt,
      u.nickname
    FROM reviews r
    JOIN users u ON u.id = r.userId
    WHERE r.storeNumber = ?
    ORDER BY r.createdAt DESC
  `).all(storeNumber);

  // Get friends of the requester
  const friendIds = requesterId ? db.prepare(`
    SELECT 
      CASE 
        WHEN userId = ? THEN friendId
        ELSE userId
      END as friendId
    FROM friends
    WHERE (userId = ? OR friendId = ?) AND status = 'accepted'
  `).all(requesterId, requesterId, requesterId).map(f => f.friendId) : [];

  // Process reviews to apply privacy rules
  const processedReviews = reviews.map(review => {
    const isAuthor = requesterId && review.userId == requesterId;
    const isFriend = friendIds.includes(review.userId);
    const canSeePrivate = isAuthor || isFriend;

    // Get photos for this review (only if authorized)
    const photos = canSeePrivate ? db.prepare(`
      SELECT id, filePath, uploadedAt
      FROM photos
      WHERE reviewId = ?
      ORDER BY uploadedAt ASC
    `).all(review.id) : [];

    return {
      id: review.id,
      visitId: review.visitId,
      userId: review.userId,
      nickname: review.nickname,
      // Ratings are always public
      ratings: {
        overall: review.ratingOverall,
        clean: review.ratingClean,
        staff: review.ratingStaff,
        hotspot: review.ratingHotspot,
        bathroom: review.ratingBathroom,
        vibe: review.ratingVibe
      },
      // Comment and photos only visible to author and friends
      comment: canSeePrivate ? review.comment : null,
      photos: canSeePrivate ? photos : [],
      createdAt: review.createdAt,
      isPrivate: !canSeePrivate
    };
  });

  res.json({ storeNumber, reviews: processedReviews });
});

// --- GET /locations/activity-batch (efficient summary for many stores) ---
router.get("/locations/activity-batch", (req, res) => {
  const { storeNumbers, requesterId } = req.query;

  let stores = [];
  if (storeNumbers) {
    stores = String(storeNumbers).split(",").map(s => s.trim()).filter(Boolean);
  }

  if (stores.length === 0) return res.json({});

  // Get friends of the requester
  const friendIds = requesterId ? db.prepare(`
    SELECT 
      CASE 
        WHEN userId = ? THEN friendId
        ELSE userId
      END as friendId
    FROM friends
    WHERE (userId = ? OR friendId = ?) AND status = 'accepted'
  `).all(requesterId, requesterId, requesterId).map(f => f.friendId) : [];

  try {
    const placeholders = stores.map(() => '?').join(',');
    const rows = db.prepare(`
      SELECT storeNumber, userId
      FROM reviews
      WHERE storeNumber IN (${placeholders})
    `).all(...stores);

    const result = {};
    stores.forEach(s => { result[s] = { reviewedByUser: false, friendReviewed: false }; });

    rows.forEach(r => {
      const sn = String(r.storeNumber);
      if (!result[sn]) result[sn] = { reviewedByUser: false, friendReviewed: false };
      if (requesterId && String(r.userId) === String(requesterId)) {
        result[sn].reviewedByUser = true;
      }
      if (!result[sn].friendReviewed && friendIds.length && friendIds.map(String).includes(String(r.userId))) {
        result[sn].friendReviewed = true;
      }
    });

    res.json(result);
  } catch (err) {
    console.error('activity-batch error', err);
    res.status(500).json({});
  }
});

// Also support POST with JSON body to avoid huge query strings for many storeNumbers
router.post("/locations/activity-batch", express.json(), (req, res) => {
  const { storeNumbers, requesterId } = req.body || {};

  let stores = [];
  if (Array.isArray(storeNumbers)) {
    stores = storeNumbers.map(s => String(s).trim()).filter(Boolean);
  } else if (storeNumbers) {
    stores = String(storeNumbers).split(",").map(s => s.trim()).filter(Boolean);
  }

  if (stores.length === 0) return res.json({});

  // Get friends of the requester
  const friendIds = requesterId ? db.prepare(`
    SELECT 
      CASE 
        WHEN userId = ? THEN friendId
        ELSE userId
      END as friendId
    FROM friends
    WHERE (userId = ? OR friendId = ?) AND status = 'accepted'
  `).all(requesterId, requesterId, requesterId).map(f => f.friendId) : [];

  try {
    const placeholders = stores.map(() => '?').join(',');
    const rows = db.prepare(`
      SELECT storeNumber, userId
      FROM reviews
      WHERE storeNumber IN (${placeholders})
    `).all(...stores);

    const result = {};
    stores.forEach(s => { result[s] = { reviewedByUser: false, friendReviewed: false }; });

    rows.forEach(r => {
      const sn = String(r.storeNumber);
      if (!result[sn]) result[sn] = { reviewedByUser: false, friendReviewed: false };
      if (requesterId && String(r.userId) === String(requesterId)) {
        result[sn].reviewedByUser = true;
      }
      if (!result[sn].friendReviewed && friendIds.length && friendIds.map(String).includes(String(r.userId))) {
        result[sn].friendReviewed = true;
      }
    });

    res.json(result);
  } catch (err) {
    console.error('activity-batch (POST) error', err);
    res.status(500).json({});
  }
});

// --- GET /admin/settings (Get app settings) ---
router.get("/admin/settings", requireAdmin, (req, res) => {
  const settings = db.prepare("SELECT key, value FROM app_settings").all();
  const settingsObj = {};
  settings.forEach(s => {
    settingsObj[s.key] = s.value;
  });
  res.json(settingsObj);
});

// --- PUT /admin/settings (Update app settings) ---
router.put("/admin/settings", express.json(), requireAdmin, (req, res) => {
  const { key, value } = req.body;

  if (!key || value === undefined) {
    return res.status(400).json({ error: "Both key and value are required." });
  }

  const validKeys = ['max_photos', 'allow_photos'];
  if (!validKeys.includes(key)) {
    return res.status(400).json({ error: "Invalid setting key." });
  }

  const existing = db.prepare("SELECT id FROM app_settings WHERE key = ?").get(key);
  
  if (existing) {
    db.prepare("UPDATE app_settings SET value = ? WHERE key = ?").run(String(value), key);
  } else {
    db.prepare("INSERT INTO app_settings (key, value) VALUES (?, ?)").run(key, String(value));
  }

  res.json({ success: true });
});

// --- DELETE /admin/photos/:photoId (Remove inappropriate content) ---
router.delete("/admin/photos/:photoId", requireAdmin, (req, res) => {
  const { photoId } = req.params;

  const photo = db.prepare("SELECT filePath FROM photos WHERE id = ?").get(photoId);
  
  if (!photo) {
    return res.status(404).json({ error: "Photo not found." });
  }

  // Delete file from disk
  const filePath = path.join(uploadDir, photo.filePath);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Delete from database
  db.prepare("DELETE FROM photos WHERE id = ?").run(photoId);

  res.json({ success: true });
});

// --- GET /uploads/:filename (Serve uploaded images) ---
router.get("/uploads/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found." });
  }
  
  res.sendFile(filePath);
});

module.exports = router;

// Error handler to ensure JSON responses for unexpected errors (including multer errors)
router.use((err, req, res, next) => {
  console.error('Unhandled error in routes:', err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: err && err.message ? err.message : 'Internal server error' });
});
