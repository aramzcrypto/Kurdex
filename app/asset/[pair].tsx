import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../constants/colors";
import { useHistory } from "../../hooks/useHistory";
import { getAssetLabel, getAssetUnit } from "../../constants/assets";
import { InteractivePriceChart } from "../../components/ui/InteractivePriceChart";
import { usePricesContext } from "../../context/PricesContext";
import { FONTS } from "../../constants/typography";

const RANGE_OPTIONS = [
  { key: "1h", interval: "5m" },
  { key: "24h", interval: "30m" },
  { key: "7d", interval: "2h" },
  { key: "30d", interval: "6h" },
] as const;

export default function AssetDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { pair } = useLocalSearchParams<{ pair: string }>();
  const pairKey = pair ? String(pair) : "USD_IQD_BLACK";
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]["key"]>("24h");
  const { data: prices } = usePricesContext();

  const interval = RANGE_OPTIONS.find((r) => r.key === range)?.interval;
  const history = useHistory(pairKey, range, interval);

  const seriesConfig = useMemo(() => {
    const hasBuy = history.data.some((p) => p.buy !== null && p.buy !== undefined);
    const hasSell = history.data.some((p) => p.sell !== null && p.sell !== undefined);
    const hasMid = history.data.some((p) => p.mid !== null && p.mid !== undefined);

    const series = [] as { label: string; values: number[]; color: string }[];
    if (hasBuy) {
      series.push({
        label: t("asset.seriesBuy"),
        values: history.data.map((p) => p.buy ?? p.mid ?? 0),
        color: COLORS.primary,
      });
    }
    if (hasSell) {
      series.push({
        label: t("asset.seriesSell"),
        values: history.data.map((p) => p.sell ?? p.mid ?? 0),
        color: COLORS.textPrimary,
      });
    }
    if (!hasBuy && !hasSell && hasMid) {
      series.push({
        label: t("asset.seriesMid"),
        values: history.data.map((p) => p.mid ?? 0),
        color: COLORS.primary,
      });
    }
    return series;
  }, [history.data, t]);

  const [activeSeries, setActiveSeries] = useState<Record<string, boolean>>({});

  const filteredSeries = seriesConfig.filter((s) => {
    if (Object.keys(activeSeries).length === 0) return true;
    return activeSeries[s.label] !== false;
  });

  const metrics = useMemo(() => {
    const values = history.data.map((p) => p.mid ?? p.buy ?? p.sell ?? 0).filter(Boolean);
    if (!values.length) return null;
    const last = values[values.length - 1];
    const high = Math.max(...values);
    const low = Math.min(...values);
    const change = ((last - values[0]) / (values[0] || 1)) * 100;
    return { last, high, low, change };
  }, [history.data]);

  const title = getAssetLabel(pairKey);
  const unit = getAssetUnit(pairKey);

  const currentPrice = useMemo(() => {
    if (!prices) return null;
    if (pairKey === "USD_IQD_BLACK") return prices.usdIqdBlack?.mid;
    if (pairKey === "USD_IQD_BANK") return prices.usdIqdBank?.mid;
    if (pairKey.endsWith("_IQD")) {
      const code = pairKey.replace("_IQD", "");
      const found = prices.otherPairs?.find((p) => p.pair.startsWith(code));
      return found?.mid;
    }
    if (pairKey === "GOLD_USD_OZ") return prices.gold?.spotUsdPerOz;
    if (pairKey === "GOLD_IQD_21K") return prices.gold?.iqd21k;
    if (pairKey === "SILVER_USD_OZ") return prices.silver?.spotUsdPerOz;
    if (pairKey === "OIL_WTI_USD") return prices.oil?.wti?.priceUsd;
    if (pairKey === "OIL_BRENT_USD") return prices.oil?.brent?.priceUsd;
    if (pairKey.endsWith("_USD")) {
      const symbol = pairKey.replace("_USD", "").toLowerCase();
      return prices.crypto?.find((c) => c.symbol.toLowerCase() === symbol)?.priceUsd;
    }
    return null;
  }, [pairKey, prices]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>{t("common.realTime")}</Text>
          <Text style={styles.heroValue}>
            {currentPrice ? currentPrice.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "--"}
            {unit ? ` ${unit}` : ""}
          </Text>
        </View>

        <View style={styles.rangeRow}>
          {RANGE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.rangePill, range === opt.key && styles.rangePillActive]}
              onPress={() => setRange(opt.key)}
            >
              <Text style={[styles.rangeText, range === opt.key && styles.rangeTextActive]}>
                {t(`asset.range${opt.key}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {history.loading ? (
          <Text style={styles.loadingText}>{t("common.loading")}...</Text>
        ) : history.data.length ? (
          <InteractivePriceChart data={history.data} series={filteredSeries.length ? filteredSeries : seriesConfig} />
        ) : (
          <Text style={styles.loadingText}>{t("asset.noData")}</Text>
        )}

        {seriesConfig.length > 1 && (
          <View style={styles.seriesRow}>
            {seriesConfig.map((s) => {
              const active = activeSeries[s.label] !== false;
              return (
                <TouchableOpacity
                  key={s.label}
                  style={[styles.seriesPill, active && styles.seriesPillActive]}
                  onPress={() =>
                    setActiveSeries((prev) => ({
                      ...prev,
                      [s.label]: !(prev[s.label] !== false),
                    }))
                  }
                >
                  <View style={[styles.seriesDot, { backgroundColor: s.color }]} />
                  <Text style={[styles.seriesText, active && styles.seriesTextActive]}>{s.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {metrics && (
          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>{t("asset.last")}</Text>
              <Text style={styles.metricValue}>{metrics.last.toLocaleString(undefined, { maximumFractionDigits: 4 })}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>{t("asset.high")}</Text>
              <Text style={styles.metricValue}>{metrics.high.toLocaleString(undefined, { maximumFractionDigits: 4 })}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>{t("asset.low")}</Text>
              <Text style={styles.metricValue}>{metrics.low.toLocaleString(undefined, { maximumFractionDigits: 4 })}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>{t("asset.change")}</Text>
              <Text style={[styles.metricValue, { color: metrics.change >= 0 ? COLORS.up : COLORS.down }]}>
                {metrics.change >= 0 ? "+" : ""}{metrics.change.toFixed(2)}%
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, gap: 16, paddingBottom: 48 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceAlt,
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: 16, fontFamily: FONTS.bold },
  hero: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  heroLabel: { color: COLORS.textSecondary, fontSize: 12, fontFamily: FONTS.medium },
  heroValue: { color: COLORS.textPrimary, fontSize: 28, fontFamily: FONTS.bold, marginTop: 6 },
  rangeRow: { flexDirection: "row", gap: 8 },
  rangePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  rangePillActive: { backgroundColor: COLORS.surfaceAlt, borderColor: COLORS.glassBorder },
  rangeText: { color: COLORS.textSecondary, fontSize: 11, fontFamily: FONTS.medium },
  rangeTextActive: { color: COLORS.textPrimary, fontFamily: FONTS.semibold },
  loadingText: { color: COLORS.textSecondary, textAlign: "center", marginTop: 12 },
  seriesRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  seriesPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  seriesPillActive: { backgroundColor: COLORS.surfaceAlt, borderColor: COLORS.glassBorder },
  seriesDot: { width: 8, height: 8, borderRadius: 4 },
  seriesText: { color: COLORS.textSecondary, fontSize: 11, fontFamily: FONTS.medium },
  seriesTextActive: { color: COLORS.textPrimary, fontFamily: FONTS.semibold },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricBox: {
    width: "48%",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  metricLabel: { color: COLORS.textSecondary, fontSize: 11, fontFamily: FONTS.medium },
  metricValue: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONTS.semibold, marginTop: 6 },
});
