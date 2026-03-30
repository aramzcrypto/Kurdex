const axios = require("axios");
const cheerio = require("cheerio");
const NodeCache = require("node-cache");
const logger = require("../logger");

const cache = new NodeCache({ stdTTL: 600 });

const URLS = {
  black: "https://egcurrency.com/en/currency/IQD/blackMarket",
  bank: "https://egcurrency.com/en/currency/IQD/bank",
  gold: "https://egcurrency.com/en/gold/USD/stock",
  silver: "https://egcurrency.com/en/silver/USD/stock",
};

const CODES = ["USD", "EUR", "GBP", "AED", "SAR", "KWD", "JOD"];

const toNumber = (value) =>
  Number(String(value).replace(/,/g, "")) || 0;

async function fetchWithRetry(url, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await axios.get(url, { timeout: 10000 });
      return res.data;
    } catch (err) {
      lastErr = err;
      const wait = 500 * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

function parseCurrencyTable(html) {
  const $ = cheerio.load(html);
  const rows = $("table tbody tr");
  const results = {};

  rows.each((_, row) => {
    const rowText = $(row).text().replace(/\s+/g, " ").trim();
    const code = CODES.find((c) => rowText.includes(c));
    if (!code) return;

    const nums = rowText.match(/\d+(?:,\d{3})*(?:\.\d+)?/g) || [];
    if (nums.length < 2) return;
    const buy = toNumber(nums[0]);
    const sell = toNumber(nums[1]);
    if (!buy || !sell) return;
    results[code] = { buy, sell, mid: (buy + sell) / 2 };
  });

  return results;
}

function parseSpotFromHtml(html, { min, max }) {
  const text = cheerio.load(html)("body").text();
  const nums = (text.match(/\d+(?:,\d{3})*(?:\.\d+)?/g) || [])
    .map(toNumber)
    .filter((n) => n >= min && n <= max);
  return nums.length ? nums[0] : null;
}

function buildSource() {
  const now = new Date();
  return {
    name: "egcurrency",
    updatedAt: now.toISOString(),
    ageMinutes: 0,
    confidence: "high",
  };
}

async function scrapeEgCurrency() {
  const cached = cache.get("egcurrency");
  if (cached) return cached;

  try {
    const [blackHtml, bankHtml, goldHtml, silverHtml] = await Promise.all([
      fetchWithRetry(URLS.black),
      fetchWithRetry(URLS.bank),
      fetchWithRetry(URLS.gold),
      fetchWithRetry(URLS.silver),
    ]);

    const blackPairs = parseCurrencyTable(blackHtml);
    const bankPairs = parseCurrencyTable(bankHtml);

    const goldSpot = parseSpotFromHtml(goldHtml, { min: 500, max: 5000 });
    const silverSpot = parseSpotFromHtml(silverHtml, { min: 1, max: 200 });

    const source = buildSource();

    const result = {
      black: blackPairs,
      bank: bankPairs,
      goldSpotUsdPerOz: goldSpot,
      silverSpotUsdPerOz: silverSpot,
      source,
    };

    cache.set("egcurrency", result);
    return result;
  } catch (err) {
    logger.error("egcurrency scrape failed", { error: err.message });
    throw err;
  }
}

module.exports = { scrapeEgCurrency };
