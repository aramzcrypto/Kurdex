import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../constants/colors";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { GoldIcon, CoinsIcon } from "@hugeicons/core-free-icons";
import { usePricesContext } from "../../context/PricesContext";
import { getApiBaseUrl } from "../../constants/api";
import { PriceCard } from "../../components/ui/PriceCard";
import { BlinkText } from "../../components/ui/BlinkText";
import { MarketMovingBanner } from "../../components/ui/MarketMovingBanner";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { BannerAdUnit } from "../../components/ads/BannerAdUnit";
import { AD_UNITS } from "../../constants/adUnits";
import { useAppOpenAd } from "../../components/ads/useAppOpenAd";
import { FONTS } from "../../constants/typography";

export default function HomeScreen() {
  useAppOpenAd();
  const router = useRouter();
  const { t } = useTranslation();
  const { data, lastFetched, loading, error, refresh, offline } = usePricesContext();

  const lastUpdated = useMemo(() => {
    if (!lastFetched) return "";
    return formatDistanceToNow(lastFetched, { addSuffix: true });
  }, [lastFetched]);

  const [dynamicBanner, setDynamicBanner] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch(`${getApiBaseUrl()}/api/content/home_banner`)
      .then(res => res.json())
      .then(json => {
        if (json && json.value) {
          setDynamicBanner(json.value);
        }
      })
      .catch(() => {}); // silently fail if no banner or network error
  }, []);

  if (loading) return <LoadingSpinner />;

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>{t("home.connectionError")}</Text>
        <Text style={styles.errorSubtitle}>{error ?? t("home.connectionSubtitle")}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryText}>{t("common.retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cryptoTop = data.crypto.slice(0, 8);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            tintColor={COLORS.textPrimary}
            refreshing={loading}
            onRefresh={refresh}
          />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>{t("common.appName")}</Text>
            <Text style={styles.appTagline}>{t("common.appTagline")}</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{t("common.live")}</Text>
          </View>
        </View>

        <View style={styles.statusRow}>
           <Text style={styles.lastUpdatedText}>{t("common.realTime")} · {lastUpdated}</Text>
        </View>

        {offline && <MarketMovingBanner message={t("home.offline")} />}
        {data.usdIqdBlack.source.ageMinutes > 30 && <MarketMovingBanner message={t("home.warningStale")} />}
        {data.divergenceAlert?.active && <MarketMovingBanner message={data.divergenceAlert.message} />}
        {dynamicBanner && <MarketMovingBanner message={dynamicBanner} />}

        <View style={styles.pricesStack}>
          <TouchableOpacity onPress={() => router.push("/asset/USD_IQD_BLACK")}>
            <PriceCard
              title="USD/IQD (Market)"
              buy={data.usdIqdBlack.buy}
              sell={data.usdIqdBlack.sell}
              mid={data.usdIqdBlack.mid}
              changePercent={data.usdIqdBlack.changePercent24h}
              unit="IQD"
              source={data.usdIqdBlack.source}
              size="hero"
            />
          </TouchableOpacity>

          {data.usdIqdBank && (
            <TouchableOpacity onPress={() => router.push("/asset/USD_IQD_BANK")}>
              <PriceCard
                title="USD/IQD (Bank)"
                buy={data.usdIqdBank.buy}
                sell={data.usdIqdBank.sell}
                mid={data.usdIqdBank.mid}
                unit="IQD"
                source={data.usdIqdBank.source}
                size="normal"
              />
            </TouchableOpacity>
          )}
        </View>

        <BannerAdUnit unitId={AD_UNITS.BANNER_HOME} />

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <HugeiconsIcon icon={GoldIcon} size={20} color={COLORS.textPrimary} strokeWidth={1.5} />
            <Text style={styles.sectionTitle}>{t("home.commodities")}</Text>
          </View>
          <TouchableOpacity onPress={() => {
             // Jump to markets and then maybe PagerView? Router push works
             router.push("/markets");
          }}>
            <Text style={styles.sectionLink}>{t("common.view")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.commoditiesGrid}>
          {/* Gold */}
          <TouchableOpacity style={styles.commodityCard} onPress={() => router.push("/asset/GOLD_USD_OZ")}>
            <Text style={styles.cardTitle}>{t("markets.gold")}</Text>
            <BlinkText 
              value={`$${data.gold.spotUsdPerOz.toLocaleString(undefined, { maximumFractionDigits: 1 })}`} 
              numericValue={data.gold.spotUsdPerOz}
              style={styles.cardValue} 
            />
            <Text style={styles.cardSubValue}>
              {data.gold.iqd21k ? (data.gold.iqd21k / 1000).toFixed(0) + "k IQD/21K" : t("common.na")}
            </Text>
          </TouchableOpacity>

          {/* Silver */}
          <TouchableOpacity style={styles.commodityCard} onPress={() => router.push("/asset/SILVER_USD_OZ")}>
            <Text style={styles.cardTitle}>{t("markets.silver")}</Text>
            <BlinkText 
              value={`$${data.silver.spotUsdPerOz.toFixed(2)}`} 
              numericValue={data.silver.spotUsdPerOz}
              style={styles.cardValue} 
            />
            <Text style={styles.cardSubValue}>
              {data.silver.iqdSilverPerMisqal ? (data.silver.iqdSilverPerMisqal / 1000).toFixed(1) + "k IQD" : t("common.na")}
            </Text>
          </TouchableOpacity>
          
          {/* Oil */}
          <TouchableOpacity style={styles.commodityCard} onPress={() => router.push("/asset/OIL_WTI_USD")}>
            <Text style={styles.cardTitle}>{t("markets.oil")} (WTI)</Text>
            {data.oil?.wti ? (
              <>
                <BlinkText 
                  value={`$${data.oil.wti.priceUsd.toFixed(2)}`} 
                  numericValue={data.oil.wti.priceUsd}
                  style={styles.cardValue} 
                />
                <Text style={[styles.cardSubValue, { color: data.oil.wti.changePercent24h >= 0 ? COLORS.up : COLORS.down }]}>
                  {data.oil.wti.changePercent24h >= 0 ? "+" : ""}{data.oil.wti.changePercent24h.toFixed(2)}%
                </Text>
              </>
            ) : (
              <Text style={styles.cardSubValue}>{t("common.unavailable")}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <HugeiconsIcon icon={CoinsIcon} size={20} color={COLORS.textPrimary} strokeWidth={1.5} />
            <Text style={styles.sectionTitle}>{t("home.cryptoTop")}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/markets")}>
            <Text style={styles.sectionLink}>{t("common.seeAll")}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {cryptoTop.map((coin) => (
            <TouchableOpacity 
              key={coin.id} 
              style={styles.cryptoCard}
              activeOpacity={0.8}
              onPress={() => router.push(`/asset/${coin.symbol.toUpperCase()}_USD`)}
            >
              <Text style={styles.cryptoSymbol}>{coin.symbol.toUpperCase()}</Text>
              <BlinkText 
                value={`$${coin.priceUsd < 1 ? coin.priceUsd.toFixed(4) : coin.priceUsd.toFixed(2)}`} 
                numericValue={coin.priceUsd}
                style={styles.cryptoPrice}
              />
              <View
                style={[
                  styles.cryptoChangeBadge,
                  { backgroundColor: coin.changePercent24h >= 0 ? "rgba(0,200,83,0.1)" : "rgba(255,51,51,0.1)" }
                ]}
              >
                <BlinkText
                  value={`${coin.changePercent24h >= 0 ? "▲" : "▼"} ${Math.abs(coin.changePercent24h).toFixed(2)}%`}
                  numericValue={coin.changePercent24h}
                  style={[
                    styles.cryptoChange,
                    { color: coin.changePercent24h >= 0 ? COLORS.up : COLORS.down },
                  ]}
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 60,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 4,
  },
  appName: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: "800",
    fontFamily: FONTS.bold,
  },
  appTagline: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,200,83,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.up,
  },
  statusText: {
    color: COLORS.up,
    fontSize: 11,
    fontFamily: FONTS.semibold,
  },
  statusRow: {
    marginTop: -8,
  },
  lastUpdatedText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.medium,
  },

  pricesStack: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: -4,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: FONTS.bold,
  },
  sectionLink: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FONTS.semibold,
  },
  sectionRow: {
    flexDirection: "row",
    gap: 12,
  },
  commoditiesGrid: {
    flexDirection: "row",
    gap: 10,
  },
  commodityCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  flexCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  cardTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.medium,
    marginBottom: 6,
  },
  cardValue: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: FONTS.bold,
  },
  cardSubValue: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 6,
  },
  horizontalScroll: {
    paddingRight: 16,
    gap: 12,
  },
  cryptoCard: {
    width: 120,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  cryptoSymbol: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: FONTS.bold,
  },
  cryptoPrice: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: FONTS.semibold,
    marginTop: 6,
  },
  cryptoChangeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 8,
  },
  cryptoChange: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: FONTS.bold,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  errorTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: FONTS.bold,
  },
  errorSubtitle: {
    color: COLORS.danger,
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
    fontFamily: FONTS.medium,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 6,
  },
  retryText: {
    color: COLORS.textPrimary,
    fontWeight: "600",
    fontSize: 14,
    fontFamily: FONTS.semibold,
  },
});
