const express = require("express");
const db = require("../db/database");

const router = express.Router();

router.post("/", (req, res) => {
  const { pair, threshold, direction, pushToken } = req.body || {};
  if (!pair || !threshold || !direction || !pushToken) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const id = db.insertAlert({
    pair,
    threshold: Number(threshold),
    direction,
    user_token: pushToken,
  });

  return res.json({ id });
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  db.deleteAlert(id);
  res.json({ ok: true });
});

router.get("/", (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).json({ error: "Missing token" });
  const { active, history } = db.listAlertsByToken(token);
  return res.json({ alerts: active, history });
});

module.exports = router;
