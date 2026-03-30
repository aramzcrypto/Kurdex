import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Link, usePathname } from "expo-router";
import { COLORS } from "../../constants/colors";
import { FONTS } from "../../constants/typography";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Currencies", href: "/currencies" },
  { label: "Metals", href: "/metals" },
  { label: "Crypto", href: "/crypto" },
  { label: "Converter", href: "/converter" },
  { label: "Alerts", href: "/alerts" },
  { label: "Settings", href: "/settings" },
];

export function WebShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <View style={styles.page}>
      <View style={styles.topbar}>
        <Text style={styles.brand}>Kurdex</Text>
        <View style={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} asChild>
                <Pressable style={[styles.navItem, active && styles.navItemActive]}>
                  <Text style={[styles.navText, active && styles.navTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </View>
      </View>
      <View style={styles.container}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topbar: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.separator,
    backgroundColor: COLORS.surface,
  },
  brand: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontFamily: FONTS.bold,
    marginBottom: 12,
  },
  nav: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  navItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
  },
  navItemActive: {
    backgroundColor: COLORS.primary,
  },
  navText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  navTextActive: {
    color: COLORS.background,
  },
  container: {
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
  },
});
