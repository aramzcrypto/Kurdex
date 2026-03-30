import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { format } from "date-fns";
import { COLORS } from "../../constants/colors";
import type { HistoryPoint } from "../../hooks/useHistory";
import { useTranslation } from "react-i18next";
import { FONTS } from "../../constants/typography";

interface PriceChartProps {
  data: HistoryPoint[];
}

const chartWidth = Dimensions.get("window").width - 40;

export function PriceChart({ data }: PriceChartProps) {
  const [selected, setSelected] = useState<HistoryPoint | null>(null);
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    if (!data.length) return null;
    const labels = data.map((p) => format(new Date(p.timestamp), "HH:mm"));
    const buy = data.map((p) => p.buy ?? p.mid ?? 0);
    const sell = data.map((p) => p.sell ?? p.mid ?? 0);
    const dotColors = data.map((p) =>
      p.source?.includes("telegram") ? COLORS.primary : COLORS.textPrimary
    );
    const telegramCount = data.filter((p) => p.source?.includes("telegram")).length;
    const egCount = data.length - telegramCount;
    return { labels, buy, sell, dotColors, telegramCount, egCount };
  }, [data]);

  if (!chartData) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t("asset.noData")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LineChart
        data={{
          labels: chartData.labels,
          datasets: [
            {
              data: chartData.buy,
              color: () => COLORS.primary,
              strokeWidth: 2,
            },
            {
              data: chartData.sell,
              color: () => COLORS.textPrimary,
              strokeWidth: 2,
            },
          ],
          legend: ["Buy", "Sell"],
        }}
        width={chartWidth}
        height={220}
        yAxisSuffix=""
        withDots
        withShadow={false}
        chartConfig={{
          backgroundColor: COLORS.surface,
          backgroundGradientFrom: COLORS.surface,
          backgroundGradientTo: COLORS.surface,
          decimalPlaces: 0,
          color: () => COLORS.textSecondary,
          labelColor: () => COLORS.textSecondary,
          propsForDots: {
            r: "3",
          },
          propsForBackgroundLines: {
            stroke: COLORS.separator,
          },
        }}
        style={styles.chart}
        getDotColor={(_, index) => chartData.dotColors[index] ?? COLORS.primary}
        onDataPointClick={({ index }) => setSelected(data[index])}
      />
      {selected && (
        <Text style={styles.tooltip}>
          {format(new Date(selected.timestamp), "PPpp")} · {selected.mid?.toFixed(2)}
        </Text>
      )}
      <View style={styles.legendRow}>
        <Text style={styles.legendText}>• Telegram</Text>
        <Text style={[styles.legendText, { color: COLORS.textPrimary }]}>• egcurrency</Text>
      </View>
      <Text style={styles.breakdown}>
        {chartData.telegramCount} readings from Telegram · {chartData.egCount} from egcurrency
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.separator,
  },
  chart: {
    borderRadius: 16,
  },
  tooltip: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 6,
    fontFamily: FONTS.regular,
  },
  legendRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  legendText: {
    color: COLORS.primary,
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  breakdown: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
  empty: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});
