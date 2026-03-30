const express = require("express");
const { fetchCoinDetails, fetchCoinOHLC } = require("../engine/cryptoDetails");
const logger = require("../logger");

const router = express.Router();

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const details = await fetchCoinDetails(id);
    res.json(details);
  } catch (err) {
    logger.error("Coin details route failed", { id, error: err.message });
    res.status(500).json({ error: "Failed to fetch coin details" });
  }
});

router.get("/:id/ohlc", async (req, res) => {
  const { id } = req.params;
  const days = req.query.days || 1;
  try {
    const ohlc = await fetchCoinOHLC(id, days);
    res.json(ohlc);
  } catch (err) {
    logger.error("Coin OHLC route failed", { id, error: err.message });
    res.status(500).json({ error: "Failed to fetch OHLC data" });
  }
});

module.exports = router;
