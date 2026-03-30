import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { getApiBaseUrl } from "../../constants/api";
import { COLORS } from "../../constants/colors";
import { FONTS } from "../../constants/typography";
import { useRouter } from "expo-router";

export default function ForgotScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      setLoading(true);
      setStatus(null);
      await axios.post(`${getApiBaseUrl()}/api/auth/forgot`, { email: email.trim() });
      setStatus(t("auth.resetSent"));
    } catch (err: any) {
      setStatus(err?.response?.data?.error || t("auth.resetSent"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.title}>{t("auth.forgotTitle")}</Text>
        <Text style={styles.subtitle}>{t("auth.forgotSubtitle")}</Text>

        <Text style={styles.label}>{t("common.email")}</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="name@email.com"
          placeholderTextColor={COLORS.textSecondary}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {status ? <Text style={styles.status}>{status}</Text> : null}

        <TouchableOpacity style={styles.primaryBtn} onPress={submit} disabled={loading}>
          <Text style={styles.primaryText}>{loading ? t("common.loading") : t("common.sendReset")}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/auth/reset")}>
          <Text style={styles.link}>{t("common.resetPassword")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: 24, gap: 12 },
  title: { color: COLORS.textPrimary, fontSize: 24, fontFamily: FONTS.bold },
  subtitle: { color: COLORS.textSecondary, fontSize: 13, fontFamily: FONTS.regular },
  label: { color: COLORS.textSecondary, fontSize: 11, fontFamily: FONTS.medium, marginTop: 8 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.separator,
    fontFamily: FONTS.medium,
  },
  status: { color: COLORS.textSecondary, fontSize: 12, fontFamily: FONTS.medium, marginTop: 6 },
  primaryBtn: {
    backgroundColor: COLORS.surfaceAlt,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  primaryText: { color: COLORS.textPrimary, fontFamily: FONTS.semibold },
  link: { color: COLORS.textPrimary, fontFamily: FONTS.semibold },
});
