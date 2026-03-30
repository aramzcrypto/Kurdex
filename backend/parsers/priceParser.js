const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  let cleaned = String(value).replace(/\s+/g, "");
  cleaned = cleaned.replace(/,/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
};

const ARABIC_DIGITS = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
};

function normalizeDigits(text) {
  return text.replace(/[٠-٩۰-۹]/g, (d) => ARABIC_DIGITS[d] || d);
}

function findNumberNearKeyword(text, keywords, min, max) {
  const lower = text.toLowerCase();
  for (const key of keywords) {
    const idx = lower.indexOf(key);
    if (idx !== -1) {
      const window = text.slice(Math.max(0, idx - 40), idx + 60);
      const nums = window.match(/\d{1,3}(?:[.,]\d{3})+/g) || [];
      for (const n of nums) {
        const value = toNumber(n);
        if (value >= min && value <= max) return value;
      }
    }
  }
  return null;
}

function findGoldByKarat(text, karat) {
  const patterns = [
    `${karat}k`,
    `${karat} k`,
    `عيار ${karat}`,
    `karat ${karat}`,
  ];
  return findNumberNearKeyword(text, patterns, 300000, 700000);
}

function parseTelegramMessage(text) {
  const raw = normalizeDigits(text).replace(/\s+/g, " ").trim();

  let buy = null;
  let sell = null;
  let confidence = "low";

  const buyMatch = raw.match(/(buy|شراء|مشتري)\s*[:\-]?\s*([\d,]+)/i);
  const sellMatch = raw.match(/(sell|بيع|مبيع)\s*[:\-]?\s*([\d,]+)/i);
  if (buyMatch || sellMatch) {
    buy = buyMatch ? toNumber(buyMatch[2]) : null;
    sell = sellMatch ? toNumber(sellMatch[2]) : null;
    confidence = "high";
  }

  if (!buy || !sell) {
    const slash = raw.match(/([\d,\.]{3,5})\s*[\/\-]\s*([\d,\.]{3,5})/);
    if (slash) {
      buy = toNumber(slash[1]);
      sell = toNumber(slash[2]);
      confidence = confidence === "high" ? confidence : "medium";
    }
  }

  if (!buy && !sell) {
    const dollarMatch = raw.match(/(dollar|usd|دولار|دۆلار|usdt)\s*[:\-]?\s*([\d,\.]+)/i);
    if (dollarMatch) {
      const value = toNumber(dollarMatch[2]);
      buy = value;
      sell = value;
      confidence = "medium";
    }
  }

  const numbers = raw.match(/\d{3,4}(?:[.,]\d{3})*/g) || [];
  if ((!buy || !sell) && numbers.length) {
    const inRange = numbers.map(toNumber).filter((n) => n >= 1400 && n <= 1700);
    if (inRange.length) {
      buy = buy ?? inRange[0] ?? null;
      sell = sell ?? inRange[1] ?? buy;
      confidence = confidence === "high" ? confidence : "low";
    }
  }

  if (buy && sell && buy < sell && Math.abs(buy - sell) < 50) {
    const temp = buy;
    buy = sell;
    sell = temp;
  }

  const goldMisqal21k =
    findGoldByKarat(raw, "21") ||
    findNumberNearKeyword(
      raw,
      ["gold", "ذهب", "طلا", "مثقال", "misqal"],
      300000,
      700000
    );
  const goldMisqal24k = findGoldByKarat(raw, "24");
  const goldMisqal18k = findGoldByKarat(raw, "18");

  return {
    buy,
    sell,
    goldMisqal21k,
    goldMisqal24k,
    goldMisqal18k,
    confidence,
    rawText: raw,
  };
}

module.exports = { parseTelegramMessage };
