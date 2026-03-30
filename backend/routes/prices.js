const express = require("express");
const crypto = require("crypto");

function createPricesRouter(engine) {
  const router = express.Router();

  router.get("/", async (_req, res) => {
    let data = engine.getCachedPrices();
    if (!data) {
      try {
        data = await engine.composeFinalPrices();
      } catch (_err) {
        data = null;
      }
    }
    if (!data) {
      return res.status(503).json({ error: "Prices not ready" });
    }

    const body = JSON.stringify(data);
    const etag = crypto.createHash("sha1").update(body).digest("hex");
    res.setHeader("ETag", etag);
    res.setHeader("Cache-Control", "no-store"); // always serve fresh to mobile client
    if (data.lastUpdated) {
      res.setHeader("Last-Modified", new Date(data.lastUpdated).toUTCString());
    }

    // Skip 304 for now — mobile clients should always get fresh data
    // ETags break realtime perception when cache TTLs differ

    return res.json(data);
  });

  return router;
}

module.exports = { createPricesRouter };
