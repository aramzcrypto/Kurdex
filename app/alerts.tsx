import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { COLORS } from "../constants/colors";
import { useRewardedAd } from "../components/ads/useRewardedAd";
import { useNotifications } from "../hooks/useNotifications";
import { getApiBaseUrl } from "../constants/api";
import { useTranslation } from "react-i18next";
import { FONTS } from "../constants/typography";

const PAIRS = [
  { label: "USD/IQD Black Market", value: "USD_IQD_BLACK" },
  { label: "Gold (USD/Oz)", value: "GOLD_USD_OZ" },
  { label: "BTC/USD", value: "BTC_USD" },
  { label: "ETH/USD", value: "ETH_USD" },
];

const LIMIT_KEY = "alert_limit";

export default function AlertsScreen() {
  const { t } = useTranslation();
  const { token } = useNotifications();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [limit, setLimit] = useState(3);
  const [modalOpen, setModalOpen] = useState(false);
  const [pair, setPair] = useState(PAIRS[0].value);
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [threshold, setThreshold] = useState("");

  const { showRewardedAd, isLoaded } = useRewardedAd({
    onRewardEarned: async () => {
      const newLimit = limit + 3;
      setLimit(newLimit);
      await AsyncStorage.setItem(LIMIT_KEY, String(newLimit));
    },
  });

  useEffect(() => {
    const loadLimit = async () => {
      const stored = await AsyncStorage.getItem(LIMIT_KEY);
      if (stored) setLimit(Number(stored));
    };
    loadLimit();
  }, []);

  const refresh = async () => {
    if (!token) return;
    const res = await axios.get(`${getApiBaseUrl()}/api/alerts?token=${token}`);
    setAlerts(res.data.alerts || []);
    setHistory(res.data.history || []);
  };

  useEffect(() => {
    refresh();
  }, [token]);

  const canAdd = alerts.length < limit;

  const createAlert = async () => {
    if (!token) return;
    await axios.post(`${getApiBaseUrl()}/api/alerts`, {
      pair,
      threshold: Number(threshold),
      direction,
      pushToken: token,
    });
    setModalOpen(false);
    setThreshold("");
    refresh();
  };

  const deleteAlert = async (id: number) => {
    await axios.delete(`${getApiBaseUrl()}/api/alerts/${id}`);
    refresh();
  };

  const activeCount = useMemo(() => alerts.length, [alerts]);
  const historyItems = useMemo(() => history ?? [], [history]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("alerts.title")}</Text>
        <TouchableOpacity
          style={[styles.addButton, !canAdd && styles.addButtonDisabled]}
          onPress={() => setModalOpen(true)}
          disabled={!canAdd}
        >
          <Text style={styles.addText}>{t("alerts.add")}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rewardBox}>
        <Text style={styles.rewardText}>{t("alerts.freeTier")}: {activeCount}/{limit} alerts</Text>
        <TouchableOpacity
          style={[styles.rewardButton, !isLoaded && styles.rewardButtonDisabled]}
          onPress={showRewardedAd}
          disabled={!isLoaded}
        >
          <Text style={styles.rewardButtonText}>{t("alerts.watchAd")}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>{t("alerts.activeAlerts")}</Text>
      {alerts.length === 0 && (
        <Text style={styles.helperText}>{t("alerts.noActive")}</Text>
      )}
      {alerts.map((a) => (
        <View key={a.id} style={styles.alertRow}>
          <View style={styles.alertInfo}>
            <Text style={styles.alertTitle}>{a.pair}</Text>
            <Text style={styles.alertSub}>
              {a.direction === "above" ? "Above" : "Below"} {a.threshold}
            </Text>
          </View>
          <View style={styles.alertActions}>
            <View style={styles.badgeActive}>
              <Text style={styles.badgeText}>{t("alerts.active")}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteAlert(a.id)}>
              <Text style={styles.delete}>{t("common.delete")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}>{t("alerts.triggered")}</Text>
      {historyItems.length === 0 && (
        <Text style={styles.helperText}>{t("alerts.noTriggered")}</Text>
      )}
      {historyItems.map((h) => (
        <View key={h.id} style={styles.alertRow}>
          <View style={styles.alertInfo}>
            <Text style={styles.alertTitle}>{h.pair}</Text>
            <Text style={styles.alertSub}>
              Triggered{" "}
              {h.triggered_at
                ? formatDistanceToNow(new Date(h.triggered_at), { addSuffix: true })
                : "--"}
            </Text>
          </View>
          <View style={styles.badgeMuted}>
              <Text style={styles.badgeTextMuted}>{t("alerts.triggered")}</Text>
          </View>
        </View>
      ))}

      <Modal visible={modalOpen} animationType="slide">
        <SafeAreaView style={styles.modal} edges={["top"]}>
          <Text style={styles.modalTitle}>{t("alerts.addAlert")}</Text>
          <Text style={styles.label}>{t("alerts.pair")}</Text>
          <View style={styles.pillRow}>
            {PAIRS.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[styles.pill, pair === p.value && styles.pillActive]}
                onPress={() => setPair(p.value)}
              >
                <Text style={styles.pillText}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{t("alerts.direction")}</Text>
          <View style={styles.pillRow}>
            {["above", "below"].map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.pill, direction === d && styles.pillActive]}
                onPress={() => setDirection(d as "above" | "below")}
              >
                <Text style={styles.pillText}>{d === "above" ? `${t("alerts.above")} ▲` : `${t("alerts.below")} ▼`}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{t("alerts.threshold")}</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={threshold}
            onChangeText={setThreshold}
          />

          <TouchableOpacity style={styles.primary} onPress={createAlert}>
            <Text style={styles.primaryText}>{t("alerts.setAlert")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondary} onPress={() => setModalOpen(false)}>
            <Text style={styles.secondaryText}>{t("common.cancel")}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
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
    gap: 18,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 34,
    fontWeight: "700",
    fontFamily: FONTS.bold,
  },
  addButton: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  addText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontFamily: FONTS.bold,
  },
  rewardBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
  },
  rewardText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  rewardButton: {
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: "center",
  },
  rewardButtonDisabled: {
    opacity: 0.4,
  },
  rewardButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontFamily: FONTS.bold,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    fontFamily: FONTS.semibold,
  },
  alertRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertActions: {
    alignItems: "flex-end",
    gap: 6,
  },
  alertTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: FONTS.semibold,
  },
  alertSub: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  delete: {
    color: COLORS.down,
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  badgeActive: {
    backgroundColor: "rgba(0,200,83,0.18)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeMuted: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: COLORS.up,
    fontSize: 11,
    fontFamily: FONTS.semibold,
  },
  badgeTextMuted: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.semibold,
  },
  helperText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  modal: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "600",
    fontFamily: FONTS.semibold,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
  },
  primary: {
    backgroundColor: COLORS.surfaceAlt,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontFamily: FONTS.bold,
  },
  secondary: {
    borderWidth: 1,
    borderColor: COLORS.separator,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryText: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.medium,
  },
});
