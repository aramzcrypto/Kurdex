import React from "react";
import { View } from "react-native";
import Svg, { Polyline, Defs, LinearGradient, Stop, Path } from "react-native-svg";
import { COLORS } from "../../constants/colors";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export const Sparkline = ({
  data,
  width = 80,
  height = 30,
  color,
}: SparklineProps) => {
  if (!data || data.length < 2) return <View style={{ width, height }} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return { x, y };
    });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(" ");
  
  // Create closed path for gradient fill
  const areaPath = `M0,${height} ` + 
    points.map(p => `L${p.x},${p.y}`).join(" ") + 
    ` L${width},${height} Z`;

  const startVal = data[0] ?? 0;
  const endVal = data[data.length - 1] ?? 0;
  const lineColor = color || (endVal >= startVal ? COLORS.up : COLORS.down);

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity="0.15" />
            <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path 
          d={areaPath} 
          fill="url(#gradient)" 
        />
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};
