const axios = require("axios");
const cheerio = require("cheerio");
const logger = require("../logger");

const URLS = [
  "https://cbi.iq/index.php?pid=ExchangeRates",
  "https://cbi.iq/exchange-rates",
];

const toNumber = (value) => Number(String(value).replace(/,/g, "")) || null;

async function scrapeCbi() {
  for (const url of URLS) {
    try {
      const res = await axios.get(url, { timeout: 10000 });
      const $ = cheerio.load(res.data);
      const rows = $("table tr");
      for (const row of rows.toArray()) {
        const text = $(row).text().replace(/\s+/g, " ").trim();
        if (!text.toLowerCase().includes("usd")) continue;
        const nums = text.match(/\d+(?:,\d{3})*(?:\.\d+)?/g) || [];
        if (!nums.length) continue;
        const rate = toNumber(nums[0]);
        if (rate) {
          return {
            buy: rate,
            sell: rate,
            mid: rate,
            source: {
              name: "egcurrency",
              updatedAt: new Date().toISOString(),
              ageMinutes: 0,
              confidence: "medium",
            },
          };
        }
      }
    } catch (err) {
      logger.warn("CBI scrape failed", { url, error: err.message });
    }
  }
  return null;
}

module.exports = { scrapeCbi };
