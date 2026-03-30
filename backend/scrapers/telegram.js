const axios = require("axios");
const cheerio = require("cheerio");
const NodeCache = require("node-cache");
const logger = require("../logger");
const { parseTelegramMessage } = require("../parsers/priceParser");
const { aiParseMessage } = require("../parsers/aiParser");

const cache = new NodeCache({ stdTTL: 120 });

const CHANNELS = [
  "https://t.me/s/PMCgroup",
  "https://t.me/s/nrxidolar",
  "https://t.me/s/iraqborsa",
  "https://t.me/s/nrxuhwall",
  "https://t.me/s/NrxiDraw24",
];

function getChannelName(url) {
  const match = url.match(/t\.me\/s\/([^/]+)/i);
  return match ? `@${match[1]}` : "@unknown";
}

function buildSource(channel, timestamp, confidence) {
  const updatedAt = timestamp ? new Date(timestamp) : new Date();
  const ageMinutes = Math.max(
    0,
    Math.round((Date.now() - updatedAt.getTime()) / 60000)
  );
  return {
    name: "telegram",
    channel,
    updatedAt: updatedAt.toISOString(),
    ageMinutes,
    confidence,
  };
}

async function fetchChannel(url) {
  const res = await axios.get(url, {
    timeout: 10000,
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  return res.data;
}

async function scrapeTelegram() {
  const cached = cache.get("telegram");
  if (cached) return cached;

  const currencyReadings = [];
  const goldReadings = [];

  for (const url of CHANNELS) {
    try {
      const html = await fetchChannel(url);
      const $ = cheerio.load(html);
      const messages = $(".tgme_widget_message").slice(0, 3).toArray();
      const channel = getChannelName(url);

      for (const msg of messages) {
        const text = $(msg).find(".tgme_widget_message_text").text().trim();
        const datetime = $(msg)
          .find(".tgme_widget_message_date time")
          .attr("datetime");
        if (!text) continue;

        let parsed = parseTelegramMessage(text);
        if (parsed.confidence === "low") {
          const aiParsed = await aiParseMessage(text);
          parsed = { ...parsed, ...aiParsed };
        }

        if (parsed.usd_iqd_buy || parsed.usd_iqd_sell || parsed.buy || parsed.sell) {
          let buy = parsed.usd_iqd_buy ?? parsed.buy ?? null;
          let sell = parsed.usd_iqd_sell ?? parsed.sell ?? null;

          if (buy && buy > 10000) buy /= 100;
          if (sell && sell > 10000) sell /= 100;

          const mid = buy && sell ? (buy + sell) / 2 : buy || sell;
          currencyReadings.push({
            pair: "USD_IQD_BLACK",
            buy,
            sell,
            mid,
            source: buildSource(channel, datetime, parsed.confidence || "medium"),
            rawText: text,
          });
        }

        const gold21 =
          parsed.gold_21k_misqal_iqd ?? parsed.goldMisqal21k ?? null;
        const gold24 =
          parsed.gold_24k_misqal_iqd ?? parsed.goldMisqal24k ?? null;
        const gold18 =
          parsed.gold_18k_misqal_iqd ?? parsed.goldMisqal18k ?? null;

        if (gold21 || gold24 || gold18) {
          goldReadings.push({
            pair: "GOLD_IQD_21K",
            iqd21k: gold21,
            iqd24k: gold24,
            iqd18k: gold18,
            source: buildSource(channel, datetime, parsed.confidence || "medium"),
            rawText: text,
          });
        }
      }
    } catch (err) {
      logger.warn("telegram scrape failed", { url, error: err.message });
    }
  }

  const result = { currencyReadings, goldReadings };
  cache.set("telegram", result);
  return result;
}

module.exports = { scrapeTelegram };
