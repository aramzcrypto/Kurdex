const axios = require("axios");
const NodeCache = require("node-cache");
const logger = require("../logger");

const cache = new NodeCache({ stdTTL: 300 }); // 5min cache

// CoinGecko IDs for oil proxies — USO is a WTI ETF tracked token
// We use "wrapped-bitcoin" as a fallback but primarily use Yahoo Finance scrape
async function scrapeOil() {
  const cached = cache.get("oil");
  if (cached) return cached;

  // Primary: CoinGecko — fetch WTI via tokenized oil or use finance endpoint
  // Yahoo Finance v8 has a public (no-key) quote endpoint
  try {
    const [wtiRes, brentRes] = await Promise.all([
      axios.get("https://query1.finance.yahoo.com/v8/finance/chart/CL=F?interval=1d&range=1d", {
        timeout: 8000,
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      }),
      axios.get("https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=1d", {
        timeout: 8000,
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      }),
    ]);

    const wtiMeta = wtiRes.data?.chart?.result?.[0]?.meta;
    const brentMeta = brentRes.data?.chart?.result?.[0]?.meta;

    const wti = wtiMeta?.regularMarketPrice || wtiMeta?.previousClose;
    const brent = brentMeta?.regularMarketPrice || brentMeta?.previousClose;

    if (!wti) throw new Error("Yahoo Finance missing WTI price");

    const result = {
      wti: {
        name: "WTI Crude Oil",
        symbol: "WTI",
        priceUsd: wti,
        changePercent24h: wtiMeta?.regularMarketChangePercent || 0,
        unit: "$/bbl",
      },
      brent: brent
        ? {
            name: "Brent Crude",
            symbol: "BRENT",
            priceUsd: brent,
            changePercent24h: brentMeta?.regularMarketChangePercent || 0,
            unit: "$/bbl",
          }
        : null,
    };

    logger.info("Oil fetched from Yahoo Finance", { wti, brent });
    cache.set("oil", result);
    return result;
  } catch (err) {
    logger.warn("Oil scrape failed", { error: err.message });
    // Return null so app doesn't crash — oil section just won't show
    return null;
  }
}

module.exports = { scrapeOil };
