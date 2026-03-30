import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, TextStyle, StyleProp } from "react-native";
import { COLORS } from "../../constants/colors";

interface BlinkTextProps {
  value: string | number;
  style?: StyleProp<TextStyle>;
  numericValue?: number;
}

export const BlinkText = ({ value, style, numericValue }: BlinkTextProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const numValue =
    numericValue !== undefined
      ? numericValue
      : typeof value === "number"
      ? value
      : Number(String(value).replace(/[^0-9.-]/g, ""));
      
  const prevRef = useRef<number | null>(null);
  const colorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setDisplayValue(value);
    
    if (
      prevRef.current !== null &&
      !isNaN(numValue) &&
      numValue !== prevRef.current
    ) {
      const isUp = numValue > prevRef.current;
      colorAnim.setValue(isUp ? 1 : 2);
      
      Animated.timing(colorAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }
    
    prevRef.current = numValue;
  }, [value, numValue]);

  const defaultColor = (StyleSheet.flatten(style)?.color as string) || COLORS.textPrimary;

  const textColor = colorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [defaultColor, COLORS.up, COLORS.down],
  });

  return (
    <Animated.Text style={[style, { color: textColor }]}>
      {displayValue}
    </Animated.Text>
  );
};
