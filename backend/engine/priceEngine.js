const NodeCache = require("node-cache");
const logger = require("../logger");
const { scrapeEgCurrency } = require("../scrapers/egcurrency");
const { scrapeTelegram } = require("../scrapers/telegram");
const { scrapeMetals } = require("../scrapers/metals");
const { scrapeCrypto } = require("../scrapers/crypto");
const { scrapeCbi } = require("../scrapers/cbi");
const { scrapeOil } = require("../scrapers/oil");
const db = require("../db/database");

const cache = new NodeCache({ stdTTL: 120 });

const scraperStatus = {
  egcurrency: "idle",
  telegram: "idle",
  metals: "idle",
  crypto: "idle",
  lastUpdated: null,
};

const state = {
  egcurrency: null,
  telegram: null,
  metals: null,
  crypto: null,
  cbi: null,
  oil: null,
};

const pctDiff = (a, b) => {
  if (!a || !b) return 0;
  return (Math.abs(a - b) / ((a + b) / 2)) * 100;
};

function setAge(source) {
  if (!source?.updatedAt) return source;
  const ageMinutes = Math.max(
    0,
    Math.round((Date.now() - new Date(source.updatedAt).getTime()) / 60000)
  );
  return { ...source, ageMinutes };
}

function bestTelegramPrice(readings) {
  const now = Date.now();
  const recent = readings
    .filter((r) => r?.source?.updatedAt)
    .map((r) => ({
      ...r,
      ageMinutes: Math.round((now - new Date(r.source.updatedAt).getTime()) / 60000),
    }))
    .filter((r) => r.ageMinutes <= 120);

  const high = recent.filter((r) => r.source.confidence === "high");
  if (high.length) return high.sort((a, b) => a.ageMinutes - b.ageMinutes)[0];

  const medium = recent.filter((r) => r.source.confidence === "medium");
  if (medium.length) return medium.sort((a, b) => a.ageMinutes - b.ageMinutes)[0];

  return recent.length ? recent[0] : null;
}

async function getBestUsdIqdPrice(telegramReadings, egPrice) {
  let divergenceAlert = null;

  const telegramBest = bestTelegramPrice(telegramReadings || []);

  if (telegramBest?.mid) {
    if (egPrice?.mid) {
      const diff = pctDiff(telegramBest.mid, egPrice.mid);
      if (diff > 3) {
        divergenceAlert = {
          active: true,
          message: `Market Moving — Sources differ by ${diff.toFixed(1)}%. Telegram: ${telegramBest.mid.toLocaleString()} | egcurrency: ${egPrice.mid.toLocaleString()}`,
          pctDiff: diff,
        };
      }
    }

    return { price: telegramBest, divergenceAlert };
  }

  if (egPrice?.mid) {
    return { price: egPrice, divergenceAlert };
  }

  const cached = db.getLatestReading("USD_IQD_BLACK");
  if (cached) {
    return {
      price: {
        pair: "USD/IQD",
        buy: cached.buy,
        sell: cached.sell,
        mid: cached.mid,
        source: {
          name: "cache",
          updatedAt: cached.created_at,
          ageMinutes: 0,
          confidence: "low",
        },
      },
      divergenceAlert,
    };
  }

  return { price: null, divergenceAlert };
}

function buildFinalPrices() {
  const egcurrency = state.egcurrency;
  const telegram = state.telegram;
  const metals = state.metals;
  const crypto = state.crypto;
  const cbi = state.cbi;

  const egBlackUsd = egcurrency?.black?.USD
    ? { ...egcurrency.black.USD, source: egcurrency.source }
    : null;
  const egBankUsd = egcurrency?.bank?.USD
    ? { ...egcurrency.bank.USD, source: egcurrency.source }
    : null;

  const best = bestTelegramPrice(telegram?.currencyReadings || []);
  let usdIqdBlack = best || egBlackUsd;

  let divergenceAlert = null;
  if (best?.mid && egBlackUsd?.mid) {
    const diff = pctDiff(best.mid, egBlackUsd.mid);
    if (diff > 3) {
      divergenceAlert = {
        active: true,
        message: `Market Moving — Sources differ by ${diff.toFixed(1)}%. Telegram: ${best.mid.toLocaleString()} | egcurrency: ${egBlackUsd.mid.toLocaleString()}`,
        pctDiff: diff,
      };
    }
  }

  if (!usdIqdBlack) {
    const cached = db.getLatestReading("USD_IQD_BLACK");
    if (cached) {
      usdIqdBlack = {
        pair: "USD/IQD",
        buy: cached.buy,
        sell: cached.sell,
        mid: cached.mid,
        source: {
          name: "cache",
          updatedAt: cached.created_at,
          ageMinutes: 0,
          confidence: "low",
        },
      };
    }
  }

  const usdIqdBank = cbi || egBankUsd || egBlackUsd;

  const otherPairs = ["EUR", "GBP", "AED", "SAR", "KWD", "JOD"]
    .map((code) => {
      const pair = egcurrency?.black?.[code];
      if (!pair) return null;
      return {
        pair: `${code}/IQD`,
        buy: pair.buy,
        sell: pair.sell,
        mid: pair.mid,
        source: setAge(egcurrency?.source),
      };
    })
    .filter(Boolean);

  const now = new Date().toISOString();

  return {
    usdIqdBlack: {
      pair: "USD/IQD",
      buy: usdIqdBlack?.buy || 0,
      sell: usdIqdBlack?.sell || 0,
      mid: usdIqdBlack?.mid || 0,
      changePercent24h: usdIqdBlack?.changePercent24h ?? 0,
      source: setAge(
        usdIqdBlack?.source || egcurrency?.source || {
          name: "cache",
          updatedAt: now,
          ageMinutes: 0,
          confidence: "low",
        }
      ),
    },
    usdIqdBank: usdIqdBank
      ? {
          pair: "USD/IQD",
          buy: usdIqdBank.buy,
          sell: usdIqdBank.sell,
          mid: usdIqdBank.mid,
          changePercent24h: usdIqdBank.changePercent24h ?? 0,
          source: setAge(
            usdIqdBank.source || egcurrency?.source || {
              name: "cache",
              updatedAt: now,
              ageMinutes: 0,
              confidence: "low",
            }
          ),
        }
      : null,
    otherPairs,
    gold: metals?.gold || null,
    silver: metals?.silver || null,
    oil: state.oil || null,
    crypto: crypto || [],
    lastUpdated: now,
    divergenceAlert: divergenceAlert || undefined,
  };
}

function persistReadings(finalPrices) {
  if (finalPrices.usdIqdBlack?.mid) {
    db.insertPriceReading({
      pair: "USD_IQD_BLACK",
      buy: finalPrices.usdIqdBlack.buy,
      sell: finalPrices.usdIqdBlack.sell,
      mid: finalPrices.usdIqdBlack.mid,
      source: finalPrices.usdIqdBlack.source?.name,
      confidence: finalPrices.usdIqdBlack.source?.confidence,
      raw_text: null,
    });
  }

  if (finalPrices.usdIqdBank?.mid) {
    db.insertPriceReading({
      pair: "USD_IQD_BANK",
      buy: finalPrices.usdIqdBank.buy,
      sell: finalPrices.usdIqdBank.sell,
      mid: finalPrices.usdIqdBank.mid,
      source: finalPrices.usdIqdBank.source?.name,
      confidence: finalPrices.usdIqdBank.source?.confidence,
      raw_text: null,
    });
  }

  if (finalPrices.otherPairs?.length) {
    finalPrices.otherPairs.forEach((pair) => {
      const key = pair.pair.replace("/", "_");
      db.insertPriceReading({
        pair: key,
        buy: pair.buy,
        sell: pair.sell,
        mid: pair.mid,
        source: pair.source?.name,
        confidence: pair.source?.confidence,
        raw_text: null,
      });
    });
  }

  if (finalPrices.gold?.spotUsdPerOz) {
    db.insertPriceReading({
      pair: "GOLD_USD_OZ",
      buy: null,
      sell: null,
      mid: finalPrices.gold.spotUsdPerOz,
      source: finalPrices.gold.source?.name,
      confidence: finalPrices.gold.source?.confidence,
      raw_text: null,
    });
    if (finalPrices.gold.iqd21k) {
      db.insertPriceReading({
        pair: "GOLD_IQD_21K",
        buy: null,
        sell: null,
        mid: finalPrices.gold.iqd21k,
        source: finalPrices.gold.source?.name,
        confidence: finalPrices.gold.source?.confidence,
        raw_text: null,
      });
    }
  }

  if (finalPrices.silver?.spotUsdPerOz) {
    db.insertPriceReading({
      pair: "SILVER_USD_OZ",
      buy: null,
      sell: null,
      mid: finalPrices.silver.spotUsdPerOz,
      source: finalPrices.silver.source?.name,
      confidence: finalPrices.silver.source?.confidence,
      raw_text: null,
    });
  }

  if (finalPrices.oil?.wti?.priceUsd) {
    db.insertPriceReading({
      pair: "OIL_WTI_USD",
      buy: null,
      sell: null,
      mid: finalPrices.oil.wti.priceUsd,
      source: "oil",
      confidence: "medium",
      raw_text: null,
    });
  }

  if (finalPrices.oil?.brent?.priceUsd) {
    db.insertPriceReading({
      pair: "OIL_BRENT_USD",
      buy: null,
      sell: null,
      mid: finalPrices.oil.brent.priceUsd,
      source: "oil",
      confidence: "medium",
      raw_text: null,
    });
  }

  if (finalPrices.crypto?.length) {
    finalPrices.crypto.forEach((coin) => {
      const symbol = coin.symbol.toUpperCase();
      db.insertPriceReading({
        pair: `${symbol}_USD`,
        buy: null,
        sell: null,
        mid: coin.priceUsd,
        source: "coingecko",
        confidence: "high",
        raw_text: null,
      });
    });
  }
}

async function composeFinalPrices() {
  let egcurrency;
  let telegram;
  let metals;
  let crypto;
  let cbi;

  try {
    scraperStatus.egcurrency = "running";
    egcurrency = await scrapeEgCurrency();
    state.egcurrency = egcurrency;
    scraperStatus.egcurrency = "ok";
  } catch (_err) {
    scraperStatus.egcurrency = "error";
  }

  try {
    scraperStatus.telegram = "running";
    telegram = await scrapeTelegram();
    state.telegram = telegram;
    scraperStatus.telegram = "ok";
  } catch (_err) {
    scraperStatus.telegram = "error";
  }

  try {
    cbi = await scrapeCbi();
    state.cbi = cbi;
  } catch (_err) {
    state.cbi = null;
  }

  const bestTelegram = bestTelegramPrice(telegram?.currencyReadings || []);
  const usdIqdRate = bestTelegram?.mid || egcurrency?.black?.USD?.mid || 0;

  try {
    scraperStatus.metals = "running";
    metals = await scrapeMetals(usdIqdRate, {
      goldSpotUsdPerOz: egcurrency?.goldSpotUsdPerOz,
      silverSpotUsdPerOz: egcurrency?.silverSpotUsdPerOz,
    });
    state.metals = metals;
    scraperStatus.metals = "ok";
  } catch (_err) {
    scraperStatus.metals = "error";
  }

  // Fetch oil prices
  try {
    const oil = await scrapeOil();
    state.oil = oil;
  } catch (_err) {
    state.oil = null;
  }

  try {
    scraperStatus.crypto = "running";
    crypto = await scrapeCrypto(usdIqdRate);
    state.crypto = crypto;
    scraperStatus.crypto = "ok";
  } catch (_err) {
    scraperStatus.crypto = "error";
  }

  const finalPrices = buildFinalPrices();
  cache.set("prices", finalPrices);
  scraperStatus.lastUpdated = finalPrices.lastUpdated;
  persistReadings(finalPrices);
  return finalPrices;
}

async function refreshTelegramOnly() {
  try {
    scraperStatus.telegram = "running";
    state.telegram = await scrapeTelegram();
    scraperStatus.telegram = "ok";
  } catch (_err) {
    scraperStatus.telegram = "error";
  }
  const finalPrices = buildFinalPrices();
  cache.set("prices", finalPrices);
  scraperStatus.lastUpdated = finalPrices.lastUpdated;
  persistReadings(finalPrices);
  return finalPrices;
}

async function refreshCryptoOnly() {
  const usdIqdRate = cache.get("prices")?.usdIqdBlack?.mid || 0;
  try {
    scraperStatus.crypto = "running";
    state.crypto = await scrapeCrypto(usdIqdRate);
    scraperStatus.crypto = "ok";
  } catch (_err) {
    scraperStatus.crypto = "error";
  }
  const finalPrices = buildFinalPrices();
  cache.set("prices", finalPrices);
  scraperStatus.lastUpdated = finalPrices.lastUpdated;
  persistReadings(finalPrices);
  return finalPrices;
}

function getCachedPrices() {
  return cache.get("prices") || null;
}

function getScraperStatus() {
  return { ...scraperStatus };
}

module.exports = {
  composeFinalPrices,
  refreshTelegramOnly,
  refreshCryptoOnly,
  getCachedPrices,
  getScraperStatus,
};
