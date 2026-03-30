import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PagerView from "react-native-pager-view";
import { formatDistanceToNow } from "date-fns";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  GoldIcon,
  OilBarrelIcon,
  CoinsIcon,
  CoinsDollarIcon,
} from "@hugeicons/core-free-icons";
import { COLORS } from "../../constants/colors";
import { usePricesContext } from "../../context/PricesContext";
import { BlinkText } from "../../components/ui/BlinkText";
import { BannerAdUnit } from "../../components/ads/BannerAdUnit";
import { AD_UNITS } from "../../constants/adUnits";
import { Sparkline } from "../../components/ui/Sparkline";
import axios from "axios";
import { IQD_CURRENCY_META } from "../../constants/assets";
import { FONTS } from "../../constants/typography";

type MarketTab = "currencies" | "crypto" | "commodities";

// Major world FX pairs (static approximate data shown as reference)
const WORLD_FX: Array<{ pair: string; baseFlag: string; quoteFlag: string }> = [
  { pair: "EUR/USD", baseFlag: "🇪🇺", quoteFlag: "🇺🇸" },
  { pair: "GBP/USD", baseFlag: "🇬🇧", quoteFlag: "🇺🇸" },
  { pair: "USD/JPY", baseFlag: "🇺🇸", quoteFlag: "🇯🇵" },
  { pair: "USD/CHF", baseFlag: "🇺🇸", quoteFlag: "🇨🇭" },
  { pair: "AUD/USD", baseFlag: "🇦🇺", quoteFlag: "🇺🇸" },
  { pair: "USD/CAD", baseFlag: "🇺🇸", quoteFlag: "🇨🇦" },
  { pair: "USD/TRY", baseFlag: "🇺🇸", quoteFlag: "🇹🇷" },
];

export default function MarketsScreen() {
  const { data, lastFetched } = usePricesContext();
  const router = useRouter();
  const { t } = useTranslation();

  const lastUpdated = useMemo(() => {
    if (!lastFetched) return "";
    return formatDistanceToNow(lastFetched, { addSuffix: true });
  }, [lastFetched]);

  const [activeTab, setActiveTab] = useState<MarketTab>("currencies");
  const [rateMode, setRateMode] = useState<"black" | "bank">("black");
  const [query, setQuery] = useState("");
  const [worldFxRates, setWorldFxRates] = useState<Record<string, number>>({});
  const pagerRef = useRef<PagerView>(null);

  // --- Currencies Memo ---
  const currencyPairs = useMemo(() => {
    const featured = rateMode === "black" ? data?.usdIqdBlack : data?.usdIqdBank;
    const others = data?.otherPairs || [];
    const usd = featured?.buy ? [{ ...featured, pair: "USD/IQD" }] : [];
    return [...usd, ...others];
  }, [data, rateMode]);

  // --- Crypto Memo ---
  const filteredCoins = useMemo(() => {
    const list = data?.crypto || [];
    if (!query) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.symbol.toLowerCase().includes(query.toLowerCase())
    );
  }, [data?.crypto, query]);

  // --- World FX rates from Frankfurter (free, no key) ---
  useEffect(() => {
    axios
      .get("https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY,CHF,AUD,CAD,TRY")
      .then((res) => {
        if (res.data?.rates) setWorldFxRates(res.data.rates);
      })
      .catch(() => {});
  }, []);

  const getWorldRate = (pair: string): number | undefined => {
    const parts = pair.split("/");
    const base = parts[0];
    const quote = parts[1];
    if (!base || !quote) return undefined;
    if (base === "USD") return worldFxRates[quote];
    if (quote === "USD") {
      const r = worldFxRates[base];
      return r ? 1 / r : undefined;
    }
    return undefined;
  };

  // ─── RENDER CURRENCIES ────────────────────────────────────────────────────
  const renderCurrencies = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* IQD market toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, rateMode === "black" && styles.toggleActive]}
          onPress={() => setRateMode("black")}
        >
          <Text style={[styles.toggleText, rateMode === "black" && styles.toggleTextActive]}>
            {t("common.marketRate")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, rateMode === "bank" && styles.toggleActive]}
          onPress={() => setRateMode("bank")}
        >
          <Text style={[styles.toggleText, rateMode === "bank" && styles.toggleTextActive]}>
            {t("common.bankRate")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* IQD Pairs Section */}
      <Text style={styles.sectionLabel}>{t("markets.iqdPairs")}</Text>
      <View style={styles.listGroupFlat}>
        {currencyPairs.map((pair, idx) => {
          const code = pair.pair.split("/")[0] || "";
          const meta = IQD_CURRENCY_META[code] || { name: code, flag: "🏳️" };
          const isUSD = pair.pair === "USD/IQD";
          const pairKey = isUSD
            ? rateMode === "black"
              ? "USD_IQD_BLACK"
              : "USD_IQD_BANK"
            : pair.pair.replace("/", "_");
          return (
            <TouchableOpacity
              key={pair.pair}
              style={[
                styles.listRowFlat,
                idx === currencyPairs.length - 1 && styles.listRowLast,
                isUSD && styles.listRowHighlight,
              ]}
              onPress={() => router.push(`/asset/${pairKey}`)}
            >
              <Text style={styles.flagLg}>{meta.flag}</Text>
              <View style={styles.listInfo}>
                <Text style={[styles.listTitle, isUSD && styles.listTitlePrimary]}>{meta.name}</Text>
                <Text style={styles.listSub}>{pair.pair}</Text>
              </View>
              <View style={styles.listPrices}>
                <BlinkText
                  value={pair.buy.toLocaleString()}
                  numericValue={pair.buy}
                  style={[styles.currencyPriceMain, isUSD && styles.currencyPriceHero]}
                />
                <Text style={styles.currencyPriceSell}>
                  {t("common.sell")} {pair.sell.toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* World FX Section */}
      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>{t("markets.worldFx")}</Text>
      <Text style={styles.sectionSubLabel}>{t("markets.worldFxSub")}</Text>
      <View style={styles.listGroupFlat}>
        {WORLD_FX.map((item, idx) => {
          const rate = getWorldRate(item.pair);
          return (
            <View
              key={item.pair}
              style={[styles.listRowFlat, idx === WORLD_FX.length - 1 && styles.listRowLast]}
            >
              <View style={styles.flagPair}>
                <Text style={styles.flagSm}>{item.baseFlag}</Text>
                <Text style={[styles.flagSm, { marginLeft: -8 }]}>{item.quoteFlag}</Text>
              </View>
              <View style={styles.listInfo}>
                <Text style={styles.listTitle}>{item.pair}</Text>
              </View>
              <Text style={styles.currencyPriceMain}>
                {rate ? rate.toFixed(4) : "--"}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  // ─── RENDER CRYPTO ────────────────────────────────────────────────────────
  const renderCryptoRow = ({ item, index }: { item: any; index: number }) => {
    const pairKey = `${item.symbol.toUpperCase()}_USD`;
    return (
      <TouchableOpacity style={styles.cryptoRow} onPress={() => router.push(`/asset/${pairKey}`)}>
      <Text style={styles.rank}>{index + 1}</Text>
      <Image source={{ uri: item.image }} style={styles.logoSmall} contentFit="contain" />
      <View style={styles.info}>
        <Text style={styles.symbol}>{item.symbol.toUpperCase()}</Text>
        <Text style={styles.nameSmall} numberOfLines={1}>{item.name}</Text>
      </View>
      <View style={styles.sparkCol}>
        <Sparkline data={item.sparkline} width={60} height={24} />
      </View>
      <View style={styles.prices}>
        <BlinkText
          value={`$${item.priceUsd < 1 ? item.priceUsd.toFixed(4) : item.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          numericValue={item.priceUsd}
          style={styles.usdSmall}
        />
        <BlinkText
          value={`${item.changePercent24h >= 0 ? "+" : ""}${item.changePercent24h.toFixed(2)}%`}
          numericValue={item.changePercent24h}
          style={[styles.changeSmall, { color: item.changePercent24h >= 0 ? COLORS.up : COLORS.down }]}
        />
      </View>
    </TouchableOpacity>
  );
  };

  // ─── RENDER COMMODITIES ───────────────────────────────────────────────────
  const renderCommodities = () => {
    const gold = data?.gold;
    const silver = data?.silver;
    const oil = data?.oil;

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* GOLD */}
        {gold && (
          <>
            <TouchableOpacity
              style={styles.commoditySectionHeader}
              onPress={() => router.push("/asset/GOLD_USD_OZ")}
            >
              <View style={styles.commodityLabel}>
                <HugeiconsIcon icon={GoldIcon} size={16} color="#FFD700" strokeWidth={1.5} />
                <Text style={styles.commodityHeaderText}>{t("markets.gold")} (XAU)</Text>
              </View>
              <View style={styles.metalSpotBadge}>
                <BlinkText
                  value={`$${gold.spotUsdPerOz.toFixed(2)}`}
                  numericValue={gold.spotUsdPerOz}
                  style={styles.metalSpotPrice}
                />
                <Text style={styles.metalSpotUnit}> /oz</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.listGroupFlat}>
              {[
                { label: "24K", purity: "Pure", val: gold.iqd24k },
                { label: "21K", purity: "87.5%", val: gold.iqd21k },
                { label: "18K", purity: "75%", val: gold.iqd18k },
              ].map((row, idx, arr) => (
                <TouchableOpacity
                  key={row.label}
                  style={[styles.listRowFlat, idx === arr.length - 1 && styles.listRowLast]}
                  onPress={() => router.push("/asset/GOLD_IQD_21K")}
                >
                  <View style={styles.karatBadge}>
                    <Text style={styles.karatText}>{row.label}</Text>
                  </View>
                  <View style={styles.listInfo}>
                    <Text style={styles.listTitle}>{row.label} Gold</Text>
                    <Text style={styles.listSub}>Misqal · {row.purity}</Text>
                  </View>
                  <BlinkText value={(row.val ?? 0).toLocaleString()} numericValue={row.val ?? 0} style={styles.currencyPriceMain} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* SILVER */}
        {silver && (
          <>
            <TouchableOpacity
              style={[styles.commoditySectionHeader, { marginTop: 24 }]}
              onPress={() => router.push("/asset/SILVER_USD_OZ")}
            >
              <View style={styles.commodityLabel}>
                <View style={styles.silverDot} />
                <Text style={styles.commodityHeaderText}>{t("markets.silver")} (XAG)</Text>
              </View>
              <View style={styles.metalSpotBadge}>
                <BlinkText
                  value={`$${(silver.spotUsdPerGram * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  numericValue={silver.spotUsdPerGram * 1000}
                  style={styles.metalSpotPrice}
                />
                <Text style={styles.metalSpotUnit}> /kg</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.listGroupFlat}>
              <TouchableOpacity
                style={[styles.listRowFlat, { borderBottomWidth: StyleSheet.hairlineWidth }]}
                onPress={() => router.push("/asset/SILVER_USD_OZ")}
              >
                <View style={[styles.karatBadge, { backgroundColor: "rgba(192,192,192,0.12)" }]}>
                  <Text style={[styles.karatText, { color: "#C0C0C0" }]}>Ag</Text>
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listTitle}>Silver</Text>
                  <Text style={styles.listSub}>Gram · Pure</Text>
                </View>
                <BlinkText
                  value={(silver.iqdSilverPerGram ?? 0).toLocaleString()}
                  numericValue={silver.iqdSilverPerGram ?? 0}
                  style={styles.currencyPriceMain}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.listRowFlat, styles.listRowLast]}
                onPress={() => router.push("/asset/SILVER_USD_OZ")}
              >
                <View style={[styles.karatBadge, { backgroundColor: "rgba(192,192,192,0.12)" }]}>
                  <Text style={[styles.karatText, { color: "#C0C0C0" }]}>Ag</Text>
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listTitle}>Silver</Text>
                  <Text style={styles.listSub}>Kilogram · Pure</Text>
                </View>
                <BlinkText
                  value={(silver.iqdSilverPerKg ?? 0).toLocaleString()}
                  numericValue={silver.iqdSilverPerKg ?? 0}
                  style={styles.currencyPriceMain}
                />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* OIL */}
        <View style={[styles.commoditySectionHeader, { marginTop: 24 }]}>
          <View style={styles.commodityLabel}>
            <HugeiconsIcon icon={OilBarrelIcon} size={16} color="#8B6914" strokeWidth={1.5} />
            <Text style={styles.commodityHeaderText}>{t("markets.oil")}</Text>
          </View>
          <Text style={styles.metalSpotUnit}>{t("markets.liveBbl")}</Text>
        </View>
        <View style={styles.listGroupFlat}>
          {oil?.wti ? (
            <TouchableOpacity
              style={[styles.listRowFlat, !oil?.brent && styles.listRowLast]}
              onPress={() => router.push("/asset/OIL_WTI_USD")}
            >
              <View style={[styles.karatBadge, { backgroundColor: "rgba(139,105,20,0.12)" }]}>
                <Text style={[styles.karatText, { color: "#B8860B" }]}>WTI</Text>
              </View>
              <View style={styles.listInfo}>
                <Text style={styles.listTitle}>WTI Crude</Text>
                <Text style={styles.listSub}>West Texas Intermediate</Text>
              </View>
              <View style={styles.prices}>
                <BlinkText
                  value={`$${oil.wti.priceUsd.toFixed(2)}`}
                  numericValue={oil.wti.priceUsd}
                  style={styles.currencyPriceMain}
                />
                <Text style={[styles.changeSmall, { color: (oil.wti.changePercent24h ?? 0) >= 0 ? COLORS.up : COLORS.down }]}>
                  {(oil.wti.changePercent24h ?? 0) >= 0 ? "+" : ""}{(oil.wti.changePercent24h ?? 0).toFixed(2)}%
                </Text>
              </View>
            </TouchableOpacity>
          ) : null}
          {oil?.brent ? (
            <TouchableOpacity
              style={[styles.listRowFlat, styles.listRowLast]}
              onPress={() => router.push("/asset/OIL_BRENT_USD")}
            >
              <View style={[styles.karatBadge, { backgroundColor: "rgba(0,100,180,0.12)" }]}>
                <Text style={[styles.karatText, { color: "#4A90D9" }]}>BRENT</Text>
              </View>
              <View style={styles.listInfo}>
                <Text style={styles.listTitle}>Brent Crude</Text>
                <Text style={styles.listSub}>North Sea Benchmark</Text>
              </View>
              <View style={styles.prices}>
                <BlinkText
                  value={`$${oil.brent.priceUsd.toFixed(2)}`}
                  numericValue={oil.brent.priceUsd}
                  style={styles.currencyPriceMain}
                />
                <Text style={[styles.changeSmall, { color: (oil.brent.changePercent24h ?? 0) >= 0 ? COLORS.up : COLORS.down }]}>
                  {(oil.brent.changePercent24h ?? 0) >= 0 ? "+" : ""}{(oil.brent.changePercent24h ?? 0).toFixed(2)}%
                </Text>
              </View>
            </TouchableOpacity>
          ) : null}
          {!oil && (
            <View style={[styles.listRowFlat, styles.listRowLast]}>
              <Text style={[styles.listSub, { marginLeft: 4 }]}>{t("common.loading")}...</Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  // ─── TABS CONFIG ─────────────────────────────────────────────────────────
  const TABS: Array<{ key: MarketTab; label: string; icon: any }> = [
    { key: "currencies", label: t("markets.fx"), icon: CoinsDollarIcon },
    { key: "crypto", label: t("markets.crypto"), icon: CoinsIcon },
    { key: "commodities", label: t("markets.commodities"), icon: GoldIcon },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Tab Pills */}
      <View style={styles.pillsWrapper}>
        <View style={styles.pillsContainer}>
          {TABS.map(({ key, label, icon }, index) => (
            <TouchableOpacity
              key={key}
              style={[styles.pill, activeTab === key && styles.pillActive]}
              onPress={() => {
                setActiveTab(key);
                pagerRef.current?.setPage(index);
              }}
            >
              <HugeiconsIcon
                icon={icon}
                size={14}
                color={activeTab === key ? COLORS.textPrimary : COLORS.textSecondary}
                strokeWidth={1.5}
              />
              <Text style={[styles.pillText, activeTab === key && styles.pillTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.lastUpdatedText}>{t("common.realTime")} · {lastUpdated}</Text>
      </View>

      <PagerView
        ref={pagerRef}
        style={styles.content}
        initialPage={0}
        onPageSelected={(e) => {
          const tab = TABS[e.nativeEvent.position];
          if (tab) setActiveTab(tab.key);
        }}
      >
        <View key="0" style={styles.pageWrapper}>
          <BannerAdUnit unitId={AD_UNITS.BANNER_CURRENCIES} style={{ marginBottom: 12, borderTopWidth: 0 }} />
          {renderCurrencies()}
        </View>

        <View key="1" style={styles.pageWrapper}>
          <BannerAdUnit unitId={AD_UNITS.BANNER_CRYPTO} style={{ marginBottom: 12, borderTopWidth: 0 }} />
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={COLORS.textSecondary} />
            <TextInput
              placeholder={t("common.searchAssets")}
              placeholderTextColor={COLORS.textSecondary}
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <FlatList
            data={filteredCoins}
            renderItem={renderCryptoRow}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </View>

        <View key="2" style={styles.pageWrapper}>
          <BannerAdUnit unitId={AD_UNITS.BANNER_METALS} style={{ marginBottom: 12, borderTopWidth: 0 }} />
          {renderCommodities()}
        </View>
      </PagerView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  pillsWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.separator,
  },
  pillsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 3,
  },
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  pillActive: { backgroundColor: COLORS.surfaceAlt },
  pillText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  pillTextActive: { color: COLORS.textPrimary },
  content: { flex: 1 },
  pageWrapper: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  // Currency
  toggleRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  toggleActive: { backgroundColor: COLORS.surfaceAlt, borderColor: COLORS.glassBorder },
  toggleText: { color: COLORS.textSecondary, fontSize: 12, fontFamily: FONTS.medium },
  toggleTextActive: { color: COLORS.textPrimary, fontWeight: "600" },
  sectionLabel: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: FONTS.bold,
    marginBottom: 6,
  },
  sectionSubLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: -4,
    marginBottom: 10,
  },

  // Flat List
  listGroupFlat: { overflow: "hidden" },
  listRowFlat: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderColor: COLORS.separator,
  },
  listRowLast: { borderBottomWidth: 0 },
  listRowHighlight: { backgroundColor: COLORS.card, borderRadius: 8, paddingHorizontal: 8, marginVertical: 2 },
  listTitlePrimary: { fontSize: 15, color: COLORS.textPrimary },
  flagLg: { fontSize: 24, marginRight: 12, width: 32, textAlign: "center" },
  flagSm: { fontSize: 18 },
  flagPair: { flexDirection: "row", marginRight: 12, width: 40, alignItems: "center" },
  listInfo: { flex: 1 },
  listTitle: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONTS.semibold },
  listSub: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2, fontFamily: FONTS.regular },
  listPrices: { alignItems: "flex-end" },
  currencyPriceMain: { color: COLORS.textPrimary, fontSize: 15, fontFamily: FONTS.bold },
  currencyPriceHero: { fontSize: 20 },
  currencyPriceSell: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2, fontFamily: FONTS.medium },

  // Crypto Row
  cryptoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: COLORS.separator,
  },
  rank: { color: COLORS.textSecondary, width: 24, fontSize: 11 },
  logoSmall: { width: 28, height: 28, marginRight: 10 },
  symbol: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONTS.bold },
  nameSmall: { color: COLORS.textSecondary, fontSize: 11, fontFamily: FONTS.regular },
  info: { flex: 1 },
  sparkCol: { marginHorizontal: 12 },
  prices: { alignItems: "flex-end" },
  usdSmall: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONTS.semibold },
  changeSmall: { fontSize: 11, fontFamily: FONTS.bold, marginTop: 2 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  searchInput: { flex: 1, marginLeft: 8, color: COLORS.textPrimary, fontSize: 13, fontFamily: FONTS.medium },

  // Commodities
  commoditySectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderColor: COLORS.separator,
  },
  commodityLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  commodityHeaderText: { color: COLORS.textPrimary, fontSize: 13, fontFamily: FONTS.bold },
  silverDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#C0C0C0" },
  metalSpotBadge: { flexDirection: "row", alignItems: "baseline" },
  metalSpotPrice: { color: COLORS.textPrimary, fontSize: 15, fontFamily: FONTS.bold },
  metalSpotUnit: { color: COLORS.textSecondary, fontSize: 11 },
  karatBadge: {
    width: 40,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255,215,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  karatText: { color: "#FFD700", fontSize: 10, fontFamily: FONTS.bold },

  sectionTitle2: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONTS.bold },
  statusRow: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  lastUpdatedText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.medium,
    opacity: 0.8,
  },
});
