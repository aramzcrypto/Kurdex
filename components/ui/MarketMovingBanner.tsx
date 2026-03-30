import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

export function MarketMovingBanner({ message }: { message: string }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(245,166,35,0.12)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(245,166,35,0.4)",
  },
  text: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 14,
  },
});
