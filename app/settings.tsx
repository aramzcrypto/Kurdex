import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../constants/colors";
import axios from "axios";
import {
  getApiBaseOverride,
  setApiBaseOverride,
  getApiBaseUrl,
} from "../constants/api";
import { useTranslation } from "react-i18next";
import { LANGUAGE_OPTIONS, setAppLanguage } from "../i18n";
import { FONTS } from "../constants/typography";

const SETTINGS_KEY = "kurdex_settings";

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState({
    rateDisplay: "black",
    currencyDisplay: "iqd",
    defaultKarat: "21K",
    notificationsEnabled: true,
    priceUpdates: true,
    sound: true,
    refreshInterval: "60s",
    showSource: true,
  });

  useEffect(() => {
    const load = async () => {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) setSettings(JSON.parse(raw));
      const storedApi = await getApiBaseOverride();
      if (storedApi) setApiBase(storedApi);
    };
    load();
  }, []);

  const [apiBase, setApiBase] = useState("");
  const [apiStatus, setApiStatus] = useState<string>("");

  const update = async (key: string, value: any) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t("settings.title")}</Text>

      <Text style={styles.section}>{t("settings.display")}</Text>
      <View style={styles.group}>
        <View style={styles.row}>
          {[
            { label: t("settings.blackMarket"), value: "black" },
            { label: t("common.bankRate"), value: "bank" },
            { label: t("settings.both"), value: "both" },
          ].map((o) => (
            <TouchableOpacity
              key={o.value}
              style={[styles.pill, settings.rateDisplay === o.value && styles.pillActive]}
              onPress={() => update("rateDisplay", o.value)}
            >
              <Text style={styles.pillText}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          {[
            { label: "IQD", value: "iqd" },
            { label: "USD", value: "usd" },
            { label: t("settings.both"), value: "both" },
          ].map((o) => (
            <TouchableOpacity
              key={o.value}
              style={[styles.pill, settings.currencyDisplay === o.value && styles.pillActive]}
              onPress={() => update("currencyDisplay", o.value)}
            >
              <Text style={styles.pillText}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          {["18K", "21K", "24K"].map((k) => (
            <TouchableOpacity
              key={k}
              style={[styles.pill, settings.defaultKarat === k && styles.pillActive]}
              onPress={() => update("defaultKarat", k)}
            >
              <Text style={styles.pillText}>{k}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.section}>{t("common.language")}</Text>
      <View style={styles.group}>
        <View style={styles.row}>
          {LANGUAGE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.pill, i18n.language === opt.value && styles.pillActive]}
              onPress={() => setAppLanguage(opt.value)}
            >
              <Text style={styles.pillText}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.section}>{t("settings.notifications")}</Text>
      <View style={styles.group}>
        <View style={styles.row}>
          {[t("settings.on"), t("settings.off")].map((v) => (
            <TouchableOpacity
              key={v}
              style={[
                styles.pill,
                settings.notificationsEnabled === (v === t("settings.on")) && styles.pillActive,
              ]}
              onPress={() => update("notificationsEnabled", v === t("settings.on"))}
            >
              <Text style={styles.pillText}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.section}>{t("settings.data")}</Text>
      <View style={styles.group}>
        <View style={styles.row}>
          {["30s", "60s", "2min", "5min"].map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.pill, settings.refreshInterval === v && styles.pillActive]}
              onPress={() => update("refreshInterval", v)}
            >
              <Text style={styles.pillText}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>{t("settings.apiBase")}</Text>
        <TextInput
          value={apiBase}
          onChangeText={setApiBase}
          placeholder="http://192.168.x.x:3000"
          placeholderTextColor={COLORS.textSecondary}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={async () => {
              await setApiBaseOverride(apiBase);
              setApiStatus(t("settings.saved"));
            }}
          >
            <Text style={styles.applyText}>{t("common.apply")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={async () => {
              await setApiBaseOverride("");
              setApiBase("");
              setApiStatus(t("settings.cleared"));
            }}
          >
            <Text style={styles.clearText}>{t("common.clear")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={async () => {
              const base = getApiBaseUrl();
              try {
                const res = await axios.get(`${base}/api/health`, {
                  timeout: 8000,
                });
                if (res?.data?.status) {
                  setApiStatus(`${t("common.connected")}: ${res.data.status}`);
                } else {
                  setApiStatus(t("settings.connectedNoHealth"));
                }
              } catch (err: any) {
                setApiStatus(`${t("common.failed")}: ${err?.message || t("settings.unreachable")}`);
              }
            }}
          >
            <Text style={styles.applyText}>{t("common.testConnection")}</Text>
          </TouchableOpacity>
        </View>
        {apiStatus ? <Text style={styles.statusText}>{apiStatus}</Text> : null}
      </View>

      <Text style={styles.section}>{t("settings.about")}</Text>
      <View style={styles.group}>
        <Text style={styles.text}>{t("settings.appVersion")}</Text>
        <Text style={styles.text}>{t("settings.dataSources")}</Text>
        <Text style={styles.text}>{t("settings.disclaimer")}</Text>
      </View>

      <Text style={styles.section}>{t("settings.premium")}</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("settings.proTitle")}</Text>
        <Text style={styles.text}>{t("settings.proList")}</Text>
        <TouchableOpacity style={styles.waitlistButton}>
          <Text style={styles.waitlistText}>{t("settings.joinWaitlist")}</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 22,
    paddingTop: 12,
    paddingBottom: 48,
    gap: 14,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 34,
    fontWeight: "700",
    fontFamily: FONTS.bold,
  },
  section: {
    color: COLORS.textSecondary,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 12,
    fontFamily: FONTS.semibold,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  group: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
  },
  applyButton: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  applyText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.semibold,
  },
  clearButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  clearText: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.semibold,
  },
  statusText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  pill: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillActive: {
    backgroundColor: COLORS.surfaceAlt,
  },
  pillText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  text: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: FONTS.semibold,
  },
  waitlistButton: {
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: "center",
  },
  waitlistText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontFamily: FONTS.bold,
  },
});
