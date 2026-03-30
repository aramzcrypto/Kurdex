import React from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

export function LoadingSpinner() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
