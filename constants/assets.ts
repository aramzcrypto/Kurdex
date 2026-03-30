export const IQD_CURRENCY_META: Record<string, { name: string; flag: string }> = {
  USD: { name: "US Dollar", flag: "🇺🇸" },
  EUR: { name: "Euro", flag: "🇪🇺" },
  GBP: { name: "British Pound", flag: "🇬🇧" },
  AED: { name: "UAE Dirham", flag: "🇦🇪" },
  SAR: { name: "Saudi Riyal", flag: "🇸🇦" },
  KWD: { name: "Kuwaiti Dinar", flag: "🇰🇼" },
  JOD: { name: "Jordanian Dinar", flag: "🇯🇴" },
};

export function getAssetLabel(pair: string) {
  if (pair === "USD_IQD_BLACK") return "USD/IQD (Market)";
  if (pair === "USD_IQD_BANK") return "USD/IQD (Bank)";
  if (pair.endsWith("_IQD")) {
    const base = pair.split("_")[0];
    const meta = IQD_CURRENCY_META[base];
    return meta ? `${meta.name} (IQD)` : `${base}/IQD`;
  }
  if (pair === "GOLD_USD_OZ") return "Gold (USD/Oz)";
  if (pair === "GOLD_IQD_21K") return "Gold 21K (IQD)";
  if (pair === "SILVER_USD_OZ") return "Silver (USD/Oz)";
  if (pair === "OIL_WTI_USD") return "WTI Crude (USD)";
  if (pair === "OIL_BRENT_USD") return "Brent Crude (USD)";
  if (pair.endsWith("_USD")) {
    const base = pair.replace("_USD", "");
    return `${base} (USD)`;
  }
  return pair;
}

export function getAssetUnit(pair: string) {
  if (pair.endsWith("_IQD")) return "IQD";
  if (pair.endsWith("_USD")) return "USD";
  return "";
}
