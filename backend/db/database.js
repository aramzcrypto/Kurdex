const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "kurdex.sqlite");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec("PRAGMA foreign_keys = ON;");

function initDb() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  db.exec(schema);
}

function insertPriceReading(reading) {
  const stmt = db.prepare(
    `INSERT INTO price_readings (pair, buy, sell, mid, source, confidence, raw_text)
     VALUES (@pair, @buy, @sell, @mid, @source, @confidence, @raw_text)`
  );
  stmt.run(reading);
}

function getLatestReading(pair) {
  const stmt = db.prepare(
    `SELECT * FROM price_readings WHERE pair = ? ORDER BY created_at DESC LIMIT 1`
  );
  return stmt.get(pair) || null;
}

function getHistory(pair, hours) {
  const stmt = db.prepare(
    `SELECT created_at as timestamp, buy, sell, mid, source
     FROM price_readings
     WHERE pair = ? AND created_at >= datetime('now', ?)
     ORDER BY created_at ASC`
  );
  return stmt.all(pair, `-${hours} hours`);
}

function insertAlert(alert) {
  const stmt = db.prepare(
    `INSERT INTO alerts (pair, threshold, direction, user_token)
     VALUES (@pair, @threshold, @direction, @user_token)`
  );
  const info = stmt.run(alert);
  return info.lastInsertRowid;
}

function deleteAlert(id) {
  const stmt = db.prepare(`DELETE FROM alerts WHERE id = ?`);
  stmt.run(id);
}

function listAlertsByToken(token) {
  const active = db
    .prepare(`SELECT * FROM alerts WHERE user_token = ? AND triggered_at IS NULL ORDER BY created_at DESC`)
    .all(token);
  const history = db
    .prepare(`SELECT * FROM alerts WHERE user_token = ? AND triggered_at IS NOT NULL ORDER BY triggered_at DESC LIMIT 10`)
    .all(token);
  return { active, history };
}

function getActiveAlerts() {
  return db
    .prepare(`SELECT * FROM alerts WHERE triggered_at IS NULL`)
    .all();
}

function markAlertTriggered(id) {
  db.prepare(`UPDATE alerts SET triggered_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
}

function upsertPushToken(token) {
  const stmt = db.prepare(`INSERT OR IGNORE INTO push_tokens (token) VALUES (?)`);
  stmt.run(token);
}

function getAllPushTokens() {
  return db.prepare(`SELECT token FROM push_tokens`).all();
}

function upsertContent(key, value) {
  const stmt = db.prepare(`
    INSERT INTO content_blocks (key, value) VALUES (@key, @value)
    ON CONFLICT(key) DO UPDATE SET value = @value, updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run({ key, value });
}

function getContent(key) {
  const row = db.prepare(`SELECT value FROM content_blocks WHERE key = ?`).get(key);
  return row ? row.value : null;
}

function getAllContent() {
  return db.prepare(`SELECT key, value FROM content_blocks`).all();
}

function createUser(email, passwordHash) {
  const stmt = db.prepare(
    `INSERT INTO users (email, password_hash) VALUES (?, ?)`
  );
  const info = stmt.run(email.toLowerCase(), passwordHash);
  return info.lastInsertRowid;
}

function findUserByEmail(email) {
  return db
    .prepare(`SELECT * FROM users WHERE email = ? AND deleted_at IS NULL`)
    .get(email.toLowerCase());
}

function findUserById(id) {
  return db
    .prepare(`SELECT * FROM users WHERE id = ? AND deleted_at IS NULL`)
    .get(id);
}

function markUserDeleted(id) {
  db.prepare(`UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
}

function createSession(userId, refreshTokenHash, expiresAt) {
  const stmt = db.prepare(
    `INSERT INTO user_sessions (user_id, refresh_token_hash, expires_at)
     VALUES (?, ?, ?)`
  );
  const info = stmt.run(userId, refreshTokenHash, expiresAt);
  return info.lastInsertRowid;
}

function deleteSessionByTokenHash(refreshTokenHash) {
  db.prepare(`DELETE FROM user_sessions WHERE refresh_token_hash = ?`).run(refreshTokenHash);
}

function deleteSessionsByUserId(userId) {
  db.prepare(`DELETE FROM user_sessions WHERE user_id = ?`).run(userId);
}

function createPasswordReset(userId, tokenHash, expiresAt) {
  const stmt = db.prepare(
    `INSERT INTO password_resets (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`
  );
  const info = stmt.run(userId, tokenHash, expiresAt);
  return info.lastInsertRowid;
}

function findPasswordReset(tokenHash) {
  return db
    .prepare(`SELECT * FROM password_resets WHERE token_hash = ?`)
    .get(tokenHash);
}

function deletePasswordReset(id) {
  db.prepare(`DELETE FROM password_resets WHERE id = ?`).run(id);
}

function deletePasswordResetsByUserId(userId) {
  db.prepare(`DELETE FROM password_resets WHERE user_id = ?`).run(userId);
}

module.exports = {
  initDb,
  insertPriceReading,
  getLatestReading,
  getHistory,
  insertAlert,
  deleteAlert,
  listAlertsByToken,
  getActiveAlerts,
  markAlertTriggered,
  upsertPushToken,
  getAllPushTokens,
  upsertContent,
  getContent,
  getAllContent,
  createUser,
  findUserByEmail,
  findUserById,
  markUserDeleted,
  createSession,
  deleteSessionByTokenHash,
  deleteSessionsByUserId,
  createPasswordReset,
  findPasswordReset,
  deletePasswordReset,
  deletePasswordResetsByUserId,
  db,
};
