const cron = require("node-cron");
const axios = require("axios");
const logger = require("../logger");
const db = require("../db/database");

function getCurrentValue(alert, prices) {
  const pair = alert.pair;
  let current = null;

  if (pair === "USD_IQD_BLACK") {
    current = prices.usdIqdBlack?.mid;
  } else if (pair === "USD_IQD_BANK") {
    current = prices.usdIqdBank?.mid;
  } else if (pair === "GOLD_USD_OZ") {
    current = prices.gold?.spotUsdPerOz;
  } else if (pair === "GOLD_IQD_21K") {
    current = prices.gold?.iqd21k;
  } else if (pair.endsWith("_USD")) {
    const symbol = pair.replace("_USD", "").toLowerCase();
    const coin = prices.crypto?.find((c) => c.symbol === symbol);
    current = coin?.priceUsd;
  }

  return current;
}

function isTriggered(alert, current) {
  if (current === null || current === undefined) return false;
  if (alert.direction === "above") return current >= alert.threshold;
  if (alert.direction === "below") return current <= alert.threshold;
  return false;
}

async function sendPush(alert, currentValue) {
  const payload = {
    to: alert.user_token,
    title: "Kurdex Alert",
    body: `${alert.pair} crossed ${alert.threshold}! Current: ${currentValue}`,
    data: { pair: alert.pair },
  };
  try {
    await axios.post("https://exp.host/--/expoapi/v2/push/send", payload, {
      timeout: 10000,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    logger.warn("Push notification failed", { error: err.message });
  }
}

function startScheduler(engine) {
  const runAll = async () => {
    logger.info("Scheduler: running full scrape");
    try {
      await engine.composeFinalPrices();
    } catch (err) {
      logger.error("Full scrape failed", { error: err.message });
    }
  };

  const runTelegram = async () => {
    logger.info("Scheduler: running telegram scrape");
    try {
      await engine.refreshTelegramOnly();
    } catch (err) {
      logger.error("Telegram scrape failed", { error: err.message });
    }
  };

  const runCrypto = async () => {
    logger.info("Scheduler: running crypto refresh");
    try {
      await engine.refreshCryptoOnly();
    } catch (err) {
      logger.error("Crypto refresh failed", { error: err.message });
    }
  };

  const checkAlerts = async () => {
    const prices = engine.getCachedPrices();
    if (!prices) return;
    const alerts = db.getActiveAlerts();
    for (const alert of alerts) {
      const current = getCurrentValue(alert, prices);
      if (isTriggered(alert, current)) {
        await sendPush(alert, current);
        db.markAlertTriggered(alert.id);
      }
    }
  };

  runAll();

  // Run full scrape every 5 minutes
  setInterval(runAll, 5 * 60 * 1000);
  // Run telegram scrape every 60 seconds
  setInterval(runTelegram, 60 * 1000);
  // Run crypto scrape every 15 seconds for realtime tracking
  setInterval(runCrypto, 15 * 1000);
  // Check alerts every 60 seconds
  setInterval(checkAlerts, 60 * 1000);
}

module.exports = { startScheduler };
