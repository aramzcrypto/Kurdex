import React, { useMemo, useRef, useState } from "react";
import { View, StyleSheet, PanResponder, Dimensions, Text } from "react-native";
import { format } from "date-fns";
import Svg, { Path, Line, Circle } from "react-native-svg";
import { COLORS } from "../../constants/colors";
import type { HistoryPoint } from "../../hooks/useHistory";
import { FONTS } from "../../constants/typography";

interface Series {
  label: string;
  values: number[];
  color: string;
}

interface InteractivePriceChartProps {
  data: HistoryPoint[];
  series: Series[];
  height?: number;
}

export function InteractivePriceChart({ data, series, height = 180 }: InteractivePriceChartProps) {
  const width = Dimensions.get("window").width - 48;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    if (!data.length || !series.length) return null;
    const allValues = series.flatMap((s) => s.values).filter((v) => Number.isFinite(v));
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min || 1;

    const points = series.map((s) =>
      s.values.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return { x, y };
      })
    );

    const paths = points.map((pts) => {
      const d = pts
        .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
        .join(" ");
      return d;
    });

    return { min, max, range, points, paths };
  }, [data, series, height, width]);

  const clampIndex = (index: number) => {
    if (!data.length) return 0;
    return Math.min(data.length - 1, Math.max(0, index));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const x = evt.nativeEvent.locationX;
        const index = Math.round((x / width) * (data.length - 1));
        setSelectedIndex(clampIndex(index));
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        const index = Math.round((x / width) * (data.length - 1));
        setSelectedIndex(clampIndex(index));
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  if (!chart) {
    return <View style={[styles.empty, { height }]} />;
  }

  const activeIndex = selectedIndex ?? data.length - 1;
  const activePoint = chart.points[0]?.[activeIndex];

  return (
    <View style={styles.container}>
      <View style={styles.chartWrap} {...panResponder.panHandlers}>
        <Svg width={width} height={height}>
          {chart.paths.map((d, idx) => (
            <Path
              key={`path-${idx}`}
              d={d}
              stroke={series[idx].color}
              strokeWidth={2.4}
              fill="none"
            />
          ))}
          {activePoint ? (
            <>
              <Line
                x1={activePoint.x}
                y1={0}
                x2={activePoint.x}
                y2={height}
                stroke={COLORS.separator}
                strokeWidth={1}
              />
              {chart.points.map((pts, idx) => (
                <Circle
                  key={`dot-${idx}`}
                  cx={pts[activeIndex]?.x}
                  cy={pts[activeIndex]?.y}
                  r={4}
                  fill={series[idx].color}
                />
              ))}
            </>
          ) : null}
        </Svg>
      </View>
      {data[activeIndex] ? (
        <View style={styles.tooltip}>
          <View style={styles.tooltipContent}>
            <View style={styles.tooltipLine}>
              <View style={[styles.legendDot, { backgroundColor: series[0].color }]} />
              <View>
                <Text style={styles.tooltipText}>
                  {series[0].label}: {series[0].values[activeIndex]?.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </Text>
              </View>
            </View>
            {series[1] && (
              <View style={styles.tooltipLine}>
                <View style={[styles.legendDot, { backgroundColor: series[1].color }]} />
                <Text style={styles.tooltipText}>
                  {series[1].label}: {series[1].values[activeIndex]?.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </Text>
              </View>
            )}
            {series[2] && (
              <View style={styles.tooltipLine}>
                <View style={[styles.legendDot, { backgroundColor: series[2].color }]} />
                <Text style={styles.tooltipText}>
                  {series[2].label}: {series[2].values[activeIndex]?.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </Text>
              </View>
            )}
            <Text style={styles.tooltipTime}>
              {format(new Date(data[activeIndex].timestamp), "PPpp")}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  chartWrap: {
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  empty: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
  },
  tooltip: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  tooltipContent: {
    gap: 6,
  },
  tooltipLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tooltipText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  tooltipTime: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
});
