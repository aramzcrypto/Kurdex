import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../constants/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Exchange01Icon,
  ChartBarLineIcon,
  GoldIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";
import { FONTS } from "../constants/typography";

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const router = useRouter();

  const SLIDES = [
    {
      title: t("onboarding.slide1Title"),
      desc: t("onboarding.slide1Desc"),
      icon: Exchange01Icon,
      color: COLORS.primary,
    },
    {
      title: t("onboarding.slide2Title"),
      desc: t("onboarding.slide2Desc"),
      icon: ChartBarLineIcon,
      color: "#E2B13C",
    },
    {
      title: t("onboarding.slide3Title"),
      desc: t("onboarding.slide3Desc"),
      icon: GoldIcon,
      color: "#C0C0C0",
    },
  ];

  const handleNext = async () => {
    if (index < SLIDES.length - 1) {
      setIndex(index + 1);
    } else {
      await AsyncStorage.setItem("hasCompletedOnboarding", "true");
      router.replace("/(tabs)");
    }
  };

  const slide = SLIDES[index] || SLIDES[0];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: `${slide.color}20` }]}>
          <HugeiconsIcon icon={slide.icon} size={64} color={slide.color} strokeWidth={1.5} />
        </View>

        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.desc}>{slide.desc}</Text>

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === index ? slide.color : COLORS.surface },
              ]}
            />
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: slide.color }]}
        onPress={handleNext}
      >
        <Text style={styles.buttonText}>
          {index === SLIDES.length - 1 ? t("onboarding.cta") : t("common.continue")}
        </Text>
        <HugeiconsIcon icon={ArrowRight01Icon} size={20} color="#000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "space-between",
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
    fontFamily: FONTS.bold,
  },
  desc: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
    fontFamily: FONTS.regular,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  button: {
    height: 60,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  buttonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: FONTS.bold,
  },
});
