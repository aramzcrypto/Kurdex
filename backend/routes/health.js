const express = require("express");

function createHealthRouter(engine) {
  const router = express.Router();

  router.get("/", (_req, res) => {
    const status = engine.getScraperStatus();
    res.json({
      status: "ok",
      uptime: Math.floor(process.uptime()),
      lastUpdated: status.lastUpdated,
      scraperStatus: {
        egcurrency: status.egcurrency,
        telegram: status.telegram,
        metals: status.metals,
        crypto: status.crypto,
      },
      environment: process.env.NODE_ENV || "development",
    });
  });

  return router;
}

module.exports = { createHealthRouter };
