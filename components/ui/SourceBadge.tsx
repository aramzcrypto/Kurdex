import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { formatDistanceToNow } from "date-fns";
import { COLORS } from "../../constants/colors";
import { FONTS } from "../../constants/typography";
import type { PriceSource } from "../../types/prices";

interface SourceBadgeProps {
  source: PriceSource;
}

export function SourceBadge({ source }: SourceBadgeProps) {
  const age = formatDistanceToNow(new Date(source.updatedAt), { addSuffix: true });
  const isFresh = source.ageMinutes < 30;
  const isStale = source.ageMinutes > 120;

  const label =
    source.name === "telegram"
      ? `Telegram ${source.channel ?? ""}`.trim()
      : source.name === "egcurrency"
      ? "egcurrency.com"
      : source.name === "cache"
      ? "Cached"
      : source.name === "coingecko"
      ? "CoinGecko"
      : source.name === "metals"
      ? "metals.live"
      : source.name;

  const color = isStale
    ? COLORS.down
    : isFresh
    ? COLORS.primary
    : COLORS.textSecondary;

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color }]}>
        {label} · {age}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
  },
  text: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
});
