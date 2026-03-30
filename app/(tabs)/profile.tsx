import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { COLORS } from "../../constants/colors";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { FONTS } from "../../constants/typography";

type IconName = ComponentProps<typeof Ionicons>["name"];

interface SettingRowProps {
  icon: IconName;
  label: string;
  value?: string;
  hasArrow?: boolean;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  danger?: boolean;
}

function SettingRow({
  icon,
  label,
  value,
  hasArrow,
  onPress,
  toggle,
  toggleValue,
  onToggle,
  danger,
}: SettingRowProps) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress && !toggle}
      activeOpacity={0.6}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={18} color={danger ? COLORS.danger : COLORS.textSecondary} />
      </View>
      <Text style={[styles.settingLabel, danger && { color: COLORS.danger }]}>{label}</Text>
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        {toggle && onToggle && (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: COLORS.separator, true: COLORS.up }}
            thumbColor={COLORS.textPrimary}
            ios_backgroundColor={COLORS.separator}
          />
        )}
        {hasArrow && <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout, deleteAccount } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [haptics, setHaptics] = useState(true);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.heroTitle}>{t("common.appName")}</Text>
          <Text style={styles.heroSubtitle}>{t("common.appTagline")}</Text>
        </View>

        {/* Account */}
        <Text style={styles.sectionLabel}>{t("profile.account")}</Text>
        <View style={styles.section}>
          {user ? (
            <>
              <SettingRow icon="mail-outline" label={user.email} value={t("profile.signedIn")} />
              <SettingRow
                icon="log-out-outline"
                label={t("common.logout")}
                hasArrow
                onPress={logout}
              />
              <SettingRow
                icon="trash-outline"
                label={t("profile.deleteAccount")}
                hasArrow
                danger
                onPress={() =>
                  Alert.alert(
                    t("profile.deleteAccount"),
                    t("profile.deleteAccountConfirm"),
                    [
                      { text: t("common.cancel"), style: "cancel" },
                      {
                        text: t("common.delete"),
                        style: "destructive",
                        onPress: deleteAccount,
                      },
                    ]
                  )
                }
              />
            </>
          ) : (
            <>
              <Text style={styles.helperTitle}>{t("profile.loggedOutTitle")}</Text>
              <SettingRow
                icon="log-in-outline"
                label={t("common.signIn")}
                hasArrow
                onPress={() => router.push("/auth/login")}
              />
              <SettingRow
                icon="person-add-outline"
                label={t("common.createAccount")}
                hasArrow
                onPress={() => router.push("/auth/register")}
              />
              <Text style={styles.helperText}>{t("profile.loggedOutSubtitle")}</Text>
            </>
          )}
        </View>

        {/* Market Preferences */}
        <Text style={styles.sectionLabel}>{t("profile.preferences")}</Text>
        <View style={styles.section}>
          <SettingRow
            icon="settings-outline"
            label={t("settings.title")}
            hasArrow
            onPress={() => router.push("/settings")}
          />
          <SettingRow
            icon="notifications-outline"
            label={t("profile.priceAlerts")}
            toggle
            toggleValue={notifications}
            onToggle={setNotifications}
          />
          <SettingRow
            icon="phone-portrait-outline"
            label={t("profile.haptics")}
            toggle
            toggleValue={haptics}
            onToggle={setHaptics}
          />
          <SettingRow
            icon="time-outline"
            label={t("profile.updateInterval")}
            value="10s"
            hasArrow
            onPress={() => Alert.alert(t("common.comingSoon"))}
          />
        </View>



        {/* Info */}
        <Text style={styles.sectionLabel}>{t("profile.about")}</Text>
        <View style={styles.section}>
          <SettingRow
            icon="information-circle-outline"
            label={t("profile.aboutKurdex")}
            hasArrow
            onPress={() => router.push("/about")}
          />
          <SettingRow
            icon="shield-checkmark-outline"
            label={t("profile.privacyPolicy")}
            hasArrow
            onPress={() => Linking.openURL("https://kurdex.app/privacy")}
          />
          <SettingRow
            icon="document-text-outline"
            label={t("profile.terms")}
            hasArrow
            onPress={() => Linking.openURL("https://kurdex.app/terms")}
          />
          <SettingRow
            icon="help-circle-outline"
            label={t("profile.support")}
            hasArrow
            onPress={() => Linking.openURL("https://kurdex.app/support")}
          />
          <SettingRow
            icon="star-outline"
            label={t("profile.rateApp")}
            hasArrow
            onPress={() => Alert.alert(t("common.comingSoon"))}
          />
        </View>

        <Text style={styles.footer}>
          {t("settings.disclaimer")}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
    gap: 8,
  },
  hero: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 6,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  heroTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontFamily: FONTS.bold,
  },
  heroSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: COLORS.separator,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingLabel: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingValue: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  footer: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: "center",
    marginTop: 24,
    lineHeight: 18,
    fontFamily: FONTS.regular,
  },
  helperText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 8,
    fontFamily: FONTS.regular,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  helperTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: FONTS.semibold,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
