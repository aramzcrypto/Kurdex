import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../constants/colors";
import type { PriceSource } from "../../types/prices";
import { BlinkText } from "./BlinkText";
import { FONTS } from "../../constants/typography";

interface PriceCardProps {
  title: string;
  buy: number;
  sell: number;
  mid?: number;
  changePercent?: number;
  unit: string;
  source: PriceSource;
  size: "hero" | "normal" | "small";
}

const formatNumber = (value: number) =>
  value.toLocaleString("en-US", { maximumFractionDigits: 2 });

function PriceCardComponent({
  title,
  buy,
  sell,
  mid,
  changePercent,
  unit,
  size,
}: PriceCardProps) {
  const { t } = useTranslation();
  const changeColor = (changePercent ?? 0) >= 0 ? COLORS.up : COLORS.down;
  const arrow = (changePercent ?? 0) >= 0 ? "▲" : "▼";

  return (
    <View style={styles.cardContainer}>
      <View style={[styles.cardContent, styles[size]]}>
        <Text style={styles.title}>{title}</Text>
        
        <View style={styles.grid}>
          <View style={styles.rateCol}>
            <Text style={styles.label}>{t("common.buy")}</Text>
            <Text style={[styles.value, size === "hero" && styles.valueHero]}>
              <BlinkText value={formatNumber(buy)} numericValue={buy} style={[styles.value, size === "hero" && styles.valueHero]} />
              <Text style={styles.unitText}> {unit}</Text>
            </Text>
          </View>
          <View style={styles.rateColRight}>
            <Text style={styles.label}>{t("common.sell")}</Text>
            <Text style={[styles.value, size === "hero" && styles.valueHero]}>
              <BlinkText value={formatNumber(sell)} numericValue={sell} style={[styles.value, size === "hero" && styles.valueHero]} />
              <Text style={styles.unitText}> {unit}</Text>
            </Text>
          </View>
        </View>

        {typeof mid === "number" && (
          <View style={styles.midRow}>
            <Text style={styles.label}>{t("common.mid")}</Text>
            <Text style={[styles.valueMid, size === "hero" && styles.valueHeroSmall]}>
              <BlinkText value={formatNumber(mid)} numericValue={mid} style={[styles.valueMid, size === "hero" && styles.valueHeroSmall]} /> {unit}
            </Text>
          </View>
        )}

        {typeof changePercent === "number" && (
          <View style={styles.footerRow}>
            <View style={[styles.badge, { backgroundColor: changeColor + "20" }]}>
              <BlinkText 
                value={`${arrow} ${Math.abs(changePercent).toFixed(2)}%`}
                numericValue={changePercent}
                style={[styles.change, { color: changeColor }]}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

export const PriceCard = React.memo(PriceCardComponent);

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.card,
  },
  cardContent: {
    padding: 16,
    gap: 12,
  },
  hero: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 16,
  },
  normal: {},
  small: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  title: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textTransform: "uppercase",
    fontFamily: FONTS.semibold,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rateCol: {
    alignItems: "flex-start",
  },
  rateColRight: {
    alignItems: "flex-end",
  },
  midRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: COLORS.separator,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.medium,
    marginBottom: 4,
  },
  value: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "600",
    fontFamily: FONTS.semibold,
  },
  valueHero: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: FONTS.bold,
  },
  valueMid: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.semibold,
  },
  valueHeroSmall: {
    fontSize: 18,
  },
  unitText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  change: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: FONTS.bold,
  },
});
