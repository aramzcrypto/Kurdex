require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");
const logger = require("./logger");
const db = require("./db/database");
const priceEngine = require("./engine/priceEngine");
const { startScheduler } = require("./engine/scheduler");
const { createPricesRouter } = require("./routes/prices");
const historyRouter = require("./routes/history");
const { createHealthRouter } = require("./routes/health");
const alertsRouter = require("./routes/alerts");
const notificationsRouter = require("./routes/notifications");
const cryptoRouter = require("./routes/crypto");
const adminRouter = require("./routes/admin");
const contentRouter = require("./routes/content");
const authRouter = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "kurdex-backend" });
});

app.get("/privacy", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "privacy.html"));
});

app.use("/api/prices", createPricesRouter(priceEngine));
app.use("/api/history", historyRouter);
app.use("/api/health", createHealthRouter(priceEngine));
app.use("/api/alerts", alertsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/crypto", cryptoRouter);
app.use("/api/admin", adminRouter);
app.use("/api/content", contentRouter);
app.use("/api/auth", authRouter);

// Future stubs
app.post("/api/p2p/offers", (_req, res) => {
  res.status(501).json({ error: "Not Implemented" });
});
app.get("/api/p2p/offers", (_req, res) => {
  res.status(501).json({ error: "Not Implemented" });
});
app.post("/api/auth/register", (_req, res) => {
  res.status(501).json({ error: "Not Implemented" });
});
app.post("/api/payments/plan", (_req, res) => {
  res.status(501).json({ error: "Not Implemented" });
});

app.use((err, _req, res, _next) => {
  logger.error("Unhandled error", { error: err.message });
  res.status(500).json({ error: "Internal server error" });
});

function start() {
  db.initDb();
  const scheduler = startScheduler(priceEngine);
  const server = app.listen(PORT, () => {
    logger.info(`Kurdex backend running on port ${PORT}`);
  });

  const shutdown = () => {
    logger.info("Shutdown initiated...");
    server.close(() => {
      logger.info("Server closed.");
      scheduler.stop();
      db.db.close();
      logger.info("Database and scheduler stopped. Exiting.");
      process.exit(0);
    });
    // Force exit after 10s if graceful shutdown fails
    setTimeout(() => {
      logger.warn("Forceful shutdown after timeout.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

start();
