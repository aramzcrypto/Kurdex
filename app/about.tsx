import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon, DocumentCodeIcon, Mail01Icon, GlobeIcon } from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";
import { FONTS } from "../constants/typography";

export default function AboutScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const openUrl = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("about.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.appInfo}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>K</Text>
          </View>
          <Text style={styles.appName}>{t("about.appName")}</Text>
          <Text style={styles.appVersion}>{t("about.version")}</Text>
        </View>

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>{t("about.disclaimerTitle")}</Text>
          <Text style={styles.disclaimerText}>{t("about.disclaimer")}</Text>
        </View>

        <View style={styles.listGroup}>
          <TouchableOpacity 
            style={styles.listItem} 
            onPress={() => openUrl("https://kurdex.app/privacy")}
          >
            <HugeiconsIcon icon={DocumentCodeIcon} size={20} color={COLORS.textSecondary} />
            <Text style={styles.listText}>{t("about.privacy")}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.listItem} 
            onPress={() => openUrl("mailto:support@kurdex.app")}
          >
            <HugeiconsIcon icon={Mail01Icon} size={20} color={COLORS.textSecondary} />
            <Text style={styles.listText}>{t("about.support")}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.listItem, styles.lastItem]} 
            onPress={() => openUrl("https://kurdex.app")}
          >
            <HugeiconsIcon icon={GlobeIcon} size={20} color={COLORS.textSecondary} />
            <Text style={styles.listText}>{t("about.website")}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>{t("about.copyright")}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  content: {
    padding: 24,
  },
  appInfo: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logoText: {
    color: "#000",
    fontSize: 40,
    fontWeight: "800",
  },
  appName: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontFamily: FONTS.bold,
  },
  appVersion: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  disclaimerBox: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
  },
  disclaimerTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: FONTS.semibold,
    marginBottom: 8,
  },
  disclaimerText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  listGroup: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: "hidden",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.separator,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  listText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: FONTS.medium,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: "center",
    marginTop: 40,
    opacity: 0.6,
  },
});
