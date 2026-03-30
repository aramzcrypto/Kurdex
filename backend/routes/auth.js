const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../db/database");
const logger = require("../logger");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const ACCESS_EXPIRES_IN = "7d";
const REFRESH_DAYS = 30;

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.replace("Bearer ", "").trim();
}

function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.findUserById(payload.sub);
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

router.post("/register", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = db.createUser(email, passwordHash);
  const user = db.findUserById(userId);

  const refreshToken = crypto.randomBytes(32).toString("hex");
  const refreshHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000).toISOString();
  db.createSession(userId, refreshHash, expiresAt);

  const accessToken = signAccessToken(user);
  return res.json({
    user: { id: user.id, email: user.email },
    accessToken,
    refreshToken,
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const refreshToken = crypto.randomBytes(32).toString("hex");
  const refreshHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000).toISOString();
  db.createSession(user.id, refreshHash, expiresAt);

  const accessToken = signAccessToken(user);
  return res.json({
    user: { id: user.id, email: user.email },
    accessToken,
    refreshToken,
  });
});

router.post("/logout", requireAuth, (req, res) => {
  const { refreshToken } = req.body || {};
  if (refreshToken) {
    db.deleteSessionByTokenHash(hashToken(refreshToken));
  } else if (req.user?.id) {
    db.deleteSessionsByUserId(req.user.id);
  }
  return res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  const user = req.user;
  return res.json({ user: { id: user.id, email: user.email } });
});

router.post("/forgot", (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Email required" });

  const user = db.findUserByEmail(email);
  if (!user) {
    return res.json({ ok: true });
  }

  const resetToken = crypto.randomBytes(24).toString("hex");
  const tokenHash = hashToken(resetToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  db.createPasswordReset(user.id, tokenHash, expiresAt);

  logger.info("Password reset token generated", { email: user.email, resetToken });
  return res.json({ ok: true });
});

router.post("/reset", async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) {
    return res.status(400).json({ error: "Token and password required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const tokenHash = hashToken(token);
  const reset = db.findPasswordReset(tokenHash);
  if (!reset) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  const isExpired = new Date(reset.expires_at).getTime() < Date.now();
  if (isExpired) {
    db.deletePasswordReset(reset.id);
    return res.status(400).json({ error: "Token expired" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  db.db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(passwordHash, reset.user_id);
  db.deletePasswordReset(reset.id);
  db.deletePasswordResetsByUserId(reset.user_id);
  db.deleteSessionsByUserId(reset.user_id);

  return res.json({ ok: true });
});

router.delete("/account", requireAuth, (req, res) => {
  const user = req.user;
  db.markUserDeleted(user.id);
  db.deleteSessionsByUserId(user.id);
  db.deletePasswordResetsByUserId(user.id);
  return res.json({ ok: true });
});

module.exports = router;
