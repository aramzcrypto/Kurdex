const axios = require("axios");
const NodeCache = require("node-cache");
const logger = require("../logger");

const cache = new NodeCache({ stdTTL: 10 }); // 10s — aligned with 15s scheduler interval

const COINS_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=true&price_change_percentage=24h";

async function scrapeCrypto(usdIqdRate) {
  const cached = cache.get("crypto");
  if (cached) return cached;

  try {
    const res = await axios.get(COINS_URL, { timeout: 10000 });
    const data = res.data || [];
    const mapped = data.map((coin) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      priceUsd: coin.current_price,
      priceIqd: Math.round(coin.current_price * (usdIqdRate || 0)),
      changePercent24h: coin.price_change_percentage_24h ?? 0,
      marketCapRank: coin.market_cap_rank ?? 0,
      image: coin.image,
      high24h: coin.high_24h,
      low24h: coin.low_24h,
      marketCap: coin.market_cap,
      volume24h: coin.total_volume,
      sparkline: coin.sparkline_in_7d?.price || [],
      source: "coingecko",
    }));
    cache.set("crypto", mapped);
    return mapped;
  } catch (err) {
    logger.error("crypto scrape failed", { error: err.message });
    throw err;
  }
}

module.exports = { scrapeCrypto };
