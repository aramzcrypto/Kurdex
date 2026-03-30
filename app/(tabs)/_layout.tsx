import React from "react";
import { View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { COLORS } from "../../constants/colors";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Home09Icon,
  MarketAnalysisIcon,
  CoinsSwapIcon,
  UserCircle02Icon,
} from "@hugeicons/core-free-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.separator,
          borderTopWidth: 1,
          height: 80,
          paddingTop: 10,
        },
        tabBarActiveTintColor: COLORS.textPrimary,
        tabBarInactiveTintColor: COLORS.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <HugeiconsIcon icon={Home09Icon} size={24} color={color} strokeWidth={focused ? 2 : 1.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="markets"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <HugeiconsIcon icon={MarketAnalysisIcon} size={24} color={color} strokeWidth={focused ? 2 : 1.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="converter"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <HugeiconsIcon icon={CoinsSwapIcon} size={24} color={color} strokeWidth={focused ? 2 : 1.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <HugeiconsIcon icon={UserCircle02Icon} size={24} color={color} strokeWidth={focused ? 2 : 1.5} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: COLORS.surfaceAlt,
  },
});
