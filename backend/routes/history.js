const express = require("express");
const db = require("../db/database");

const router = express.Router();

router.get("/:pair", (req, res) => {
  const pair = req.params.pair;
  const range = String(req.query.range || "").toLowerCase();
  const hoursParam = Number(req.query.hours || 0);
  const intervalParam = String(req.query.interval || "");
  const limitParam = Number(req.query.limit || 0);

  const rangeToHours = {
    "1h": 1,
    "24h": 24,
    "7d": 24 * 7,
    "30d": 24 * 30,
  };

  const hours = hoursParam || rangeToHours[range] || 24;
  const history = db.getHistory(pair, hours) || [];

  const intervalMs = (() => {
    if (!intervalParam) return 0;
    const match = intervalParam.match(/^(\d+)(m|h)$/i);
    if (!match) return 0;
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    if (!value) return 0;
    return unit === "h" ? value * 60 * 60 * 1000 : value * 60 * 1000;
  })();

  let reduced = history;
  if (intervalMs > 0 && history.length > 2) {
    const buckets = new Map();
    history.forEach((point) => {
      const ts = new Date(point.timestamp).getTime();
      const bucket = Math.floor(ts / intervalMs) * intervalMs;
      buckets.set(bucket, point);
    });
    reduced = Array.from(buckets.keys())
      .sort((a, b) => a - b)
      .map((key) => buckets.get(key));
  }

  if (limitParam && reduced.length > limitParam) {
    const step = Math.ceil(reduced.length / limitParam);
    reduced = reduced.filter((_, index) => index % step === 0);
  }

  res.json(reduced || []);
});

module.exports = router;
