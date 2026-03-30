const axios = require("axios");
const NodeCache = require("node-cache");
const logger = require("../logger");

const cache = new NodeCache({ stdTTL: 120 }); // 2 min cache for realtime updates
const TROY_OZ_TO_GRAMS = 31.1035;
const MISQAL_GRAMS = 4.608;

function buildResult(goldOz, silverOz, usdIqdRate, confidence, sourceName) {
  const goldPerGram = goldOz / TROY_OZ_TO_GRAMS;
  const silverPerGram = silverOz / TROY_OZ_TO_GRAMS;
  const source = {
    name: sourceName || "YahooFinance",
    updatedAt: new Date().toISOString(),
    ageMinutes: 0,
    confidence,
  };

  const gold = {
    metal: "gold",
    spotUsdPerOz: goldOz,
    spotUsdPerGram: goldPerGram,
    iqd24k: Math.round(goldPerGram * MISQAL_GRAMS * 1.000 * usdIqdRate),
    iqd21k: Math.round(goldPerGram * MISQAL_GRAMS * 0.875 * usdIqdRate),
    iqd18k: Math.round(goldPerGram * MISQAL_GRAMS * 0.750 * usdIqdRate),
    source,
  };

  const silver = {
    metal: "silver",
    spotUsdPerOz: silverOz,
    spotUsdPerGram: silverPerGram,
    iqdSilverPerMisqal: Math.round(silverPerGram * MISQAL_GRAMS * usdIqdRate),
    iqdSilverPerGram: Math.round(silverPerGram * usdIqdRate),
    iqdSilverPerKg: Math.round(silverPerGram * 1000 * usdIqdRate),
    source,
  };

  return { gold, silver };
}

// Primary: Yahoo Finance — completely free, real-time quotes for futures (GC=F, SI=F)
async function fetchFromYahooFinance() {
  const [goldRes, silverRes] = await Promise.all([
    axios.get("https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=1d", {
      timeout: 8000,
      headers: { "User-Agent": "Mozilla/5.0" },
    }),
    axios.get("https://query1.finance.yahoo.com/v8/finance/chart/SI=F?interval=1d&range=1d", {
      timeout: 8000,
      headers: { "User-Agent": "Mozilla/5.0" },
    }),
  ]);

  const goldMeta = goldRes.data?.chart?.result?.[0]?.meta;
  const silverMeta = silverRes.data?.chart?.result?.[0]?.meta;

  const goldOz = goldMeta?.regularMarketPrice || goldMeta?.previousClose;
  const silverOz = silverMeta?.regularMarketPrice || silverMeta?.previousClose;

  if (!goldOz) throw new Error("Yahoo Finance missing gold price");

  logger.info("Metals fetched from Yahoo Finance", { goldOz, silverOz });
  return { goldOz: Number(goldOz), silverOz: silverOz ? Number(silverOz) : Number(goldOz) / 80 };
}

// Fallback: CoinGecko spot-pegged tokens
async function fetchFromCoinGecko() {
  const res = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=tether-gold,kinesis-silver&vs_currencies=usd",
    { timeout: 10000 }
  );
  const goldOz = res.data["tether-gold"]?.usd;
  const silverOz = res.data["kinesis-silver"]?.usd;
  if (!goldOz || !silverOz) throw new Error("CoinGecko missing metals prices");
  return { goldOz, silverOz };
}

async function scrapeMetals(usdIqdRate, fallbackSpot) {
  const cached = cache.get("metals");
  if (cached) return cached;

  // Try Yahoo Finance first (most accurate, realtime, no key limit)
  try {
    const { goldOz, silverOz } = await fetchFromYahooFinance();
    const result = buildResult(goldOz, silverOz, usdIqdRate, "high", "YahooFinance");
    cache.set("metals", result);
    return result;
  } catch (err) {
    logger.warn("Yahoo Finance metals fetch failed", { error: err.message });
  }

  // Try CoinGecko Fallback
  try {
    const { goldOz, silverOz } = await fetchFromCoinGecko();
    const result = buildResult(goldOz, silverOz, usdIqdRate, "medium", "CoinGecko");
    cache.set("metals", result);
    return result;
  } catch (err) {
    logger.warn("CoinGecko metals fallback failed", { error: err.message });
  }

  // Static fallback
  if (fallbackSpot?.goldSpotUsdPerOz && fallbackSpot?.silverSpotUsdPerOz) {
    const result = buildResult(
      fallbackSpot.goldSpotUsdPerOz,
      fallbackSpot.silverSpotUsdPerOz,
      usdIqdRate,
      "low",
      "Fallback"
    );
    cache.set("metals", result);
    return result;
  }

  throw new Error("All metals sources failed");
}

module.exports = { scrapeMetals };
