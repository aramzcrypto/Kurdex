const axios = require("axios");
const logger = require("../logger");

async function fetchCoinDetails(id) {
  try {
    const res = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`
    );
    const data = res.data;
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      description: data.description?.en || "",
      links: {
        homepage: data.links?.homepage?.[0] || "",
        blockchain_site: data.links?.blockchain_site?.[0] || "",
        official_forum_url: data.links?.official_forum_url?.[0] || "",
        twitter_screen_name: data.links?.twitter_screen_name || "",
      },
      market_data: {
        current_price: data.market_data?.current_price?.usd || 0,
        market_cap: data.market_data?.market_cap?.usd || 0,
        total_volume: data.market_data?.total_volume?.usd || 0,
        high_24h: data.market_data?.high_24h?.usd || 0,
        low_24h: data.market_data?.low_24h?.usd || 0,
        price_change_percentage_24h: data.market_data?.price_change_percentage_24h || 0,
        circulating_supply: data.market_data?.circulating_supply || 0,
        total_supply: data.market_data?.total_supply || 0,
        max_supply: data.market_data?.max_supply || 0,
      },
      sparkline: data.market_data?.sparkline_7d?.price || [],
    };
  } catch (err) {
    logger.error("Fetch coin details failed", { id, error: err.message });
    throw err;
  }
}

async function fetchCoinOHLC(id, days = 1) {
  try {
    const res = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${id}/ohlc?vs_currency=usd&days=${days}`
    );
    return res.data; // Array of [time, open, high, low, close]
  } catch (err) {
    logger.error("Fetch coin OHLC failed", { id, error: err.message });
    throw err;
  }
}

module.exports = { fetchCoinDetails, fetchCoinOHLC };
