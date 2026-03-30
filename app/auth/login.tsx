import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { FONTS } from "../../constants/typography";

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      setLoading(true);
      setError(null);
      await login(email.trim(), password);
      router.back();
    } catch (err: any) {
      setError(err?.response?.data?.error || t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.title}>{t("auth.loginTitle")}</Text>
        <Text style={styles.subtitle}>{t("auth.loginSubtitle")}</Text>

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

        <Text style={styles.label}>{t("common.password")}</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={COLORS.textSecondary}
          style={styles.input}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.primaryBtn} onPress={submit} disabled={loading}>
          <Text style={styles.primaryText}>{loading ? t("common.loading") : t("common.signIn")}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/auth/forgot")}>
          <Text style={styles.link}>{t("common.forgotPassword")}</Text>
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>{t("auth.noAccount")}</Text>
          <TouchableOpacity onPress={() => router.push("/auth/register")}>
            <Text style={styles.link}>{t("common.createAccount")}</Text>
          </TouchableOpacity>
        </View>
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
  error: { color: COLORS.danger, fontSize: 12, fontFamily: FONTS.medium, marginTop: 6 },
  primaryBtn: {
    backgroundColor: COLORS.surfaceAlt,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  primaryText: { color: COLORS.textPrimary, fontFamily: FONTS.semibold },
  link: { color: COLORS.textPrimary, fontFamily: FONTS.semibold, marginTop: 10 },
  footerRow: { flexDirection: "row", gap: 6, alignItems: "center", marginTop: 8 },
  footerText: { color: COLORS.textSecondary, fontFamily: FONTS.regular },
});
