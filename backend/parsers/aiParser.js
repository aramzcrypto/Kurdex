const axios = require("axios");
const NodeCache = require("node-cache");
const logger = require("../logger");

const cache = new NodeCache({ stdTTL: 3600 });
const callTimestamps = [];
const MAX_CALLS_PER_MIN = 10;

function canCall() {
  const now = Date.now();
  while (callTimestamps.length && now - callTimestamps[0] > 60000) {
    callTimestamps.shift();
  }
  if (callTimestamps.length >= MAX_CALLS_PER_MIN) return false;
  callTimestamps.push(now);
  return true;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch (_err) {
    return null;
  }
}

async function aiParseMessage(message) {
  const cached = cache.get(message);
  if (cached) return cached;

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { confidence: "low" };
  if (!canCall()) return { confidence: "low" };

  const system =
    "You are a price extraction assistant. Extract currency and gold prices from Iraqi market messages. Messages may be in English, Kurdish (Sorani), or Arabic. Always respond with JSON only, no explanation.";

  const user = `Extract prices from this market message. Return ONLY valid JSON:\n{\n  \"usd_iqd_buy\": number or null,\n  \"usd_iqd_sell\": number or null,\n  \"gold_21k_misqal_iqd\": number or null,\n  \"gold_24k_misqal_iqd\": number or null,\n  \"gold_18k_misqal_iqd\": number or null,\n  \"confidence\": \"high\" | \"medium\" | \"low\",\n  \"notes\": \"brief explanation\"\n}\n\nMessage: ${message}`;

  try {
    const useOpenRouter = Boolean(process.env.OPENROUTER_API_KEY);
    const url = useOpenRouter
      ? "https://openrouter.ai/api/v1/chat/completions"
      : "https://api.anthropic.com/v1/messages";

    const payload = useOpenRouter
      ? {
          model: "anthropic/claude-3.5-sonnet",
          max_tokens: 300,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }
      : {
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          system,
          messages: [{ role: "user", content: user }],
        };

    const headers = useOpenRouter
      ? {
          Authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        }
      : {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        };

    const res = await axios.post(url, payload, {
      headers,
      timeout: 15000,
    });

    const content = useOpenRouter
      ? res.data?.choices?.[0]?.message?.content || ""
      : res.data?.content?.[0]?.text || "";
    const parsed = safeJsonParse(content) || { confidence: "low" };
    cache.set(message, parsed);
    return parsed;
  } catch (err) {
    logger.warn("AI parse failed", { error: err.message });
    return { confidence: "low" };
  }
}

module.exports = { aiParseMessage };
