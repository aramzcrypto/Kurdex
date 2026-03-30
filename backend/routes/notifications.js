const express = require("express");
const db = require("../db/database");

const router = express.Router();

router.post("/register", (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: "Missing token" });
  db.upsertPushToken(token);
  return res.json({ ok: true });
});

module.exports = router;
