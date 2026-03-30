export interface PriceSource {
  name: "egcurrency" | "telegram" | "cache" | "coingecko" | "metals" | "FreeGoldAPI" | "CoinGecko" | "Fallback" | "FreeGoldAPI" | string;
  channel?: string;
  updatedAt: string;
  ageMinutes: number;
  confidence: "high" | "medium" | "low";
}

export interface CurrencyPair {
  pair: string;
  buy: number;
  sell: number;
  mid: number;
  changePercent24h?: number;
  source: PriceSource;
}

export interface MetalPrice {
  metal: "gold" | "silver";
  spotUsdPerOz: number;
  spotUsdPerGram: number;
  iqd18k?: number;
  iqd21k?: number;
  iqd24k?: number;
  iqdSilverPerMisqal?: number;
  iqdSilverPerGram?: number;
  iqdSilverPerKg?: number;
  source: PriceSource;
}

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number;
  priceIqd: number;
  changePercent24h: number;
  marketCapRank: number;
  image: string;
  high24h?: number;
  low24h?: number;
  marketCap?: number;
  volume24h?: number;
  sparkline?: number[];
}

export interface OilCommodity {
  name: string;
  symbol: string;
  priceUsd: number;
  changePercent24h: number;
  unit: string;
}

export interface AllPrices {
  usdIqdBlack: CurrencyPair;
  usdIqdBank: CurrencyPair;
  otherPairs: CurrencyPair[];
  gold: MetalPrice;
  silver: MetalPrice;
  oil?: { wti: OilCommodity | null; brent: OilCommodity | null } | null;
  crypto: CryptoPrice[];
  lastUpdated: string;
  divergenceAlert?: {
    active: boolean;
    message: string;
    pctDiff: number;
  };
}
