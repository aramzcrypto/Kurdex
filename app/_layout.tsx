import React, { useEffect } from "react";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import { View, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  NotoSansArabic_400Regular,
  NotoSansArabic_500Medium,
  NotoSansArabic_600SemiBold,
  NotoSansArabic_700Bold,
} from "@expo-google-fonts/noto-sans-arabic";
import * as SplashScreen from "expo-splash-screen";
import { getMobileAds } from "../components/ads/adsRuntime";
import { PricesProvider } from "../context/PricesContext";
import { ErrorBoundary } from "../components/ui/ErrorBoundary";
import { useNotifications } from "../hooks/useNotifications";
import { MarketMovingBanner } from "../components/ui/MarketMovingBanner";
import { hydrateApiBaseOverride } from "../constants/api";
import { initI18n } from "../i18n";
import { AuthProvider } from "../context/AuthContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    NotoSansArabic_400Regular,
    NotoSansArabic_500Medium,
    NotoSansArabic_600SemiBold,
    NotoSansArabic_700Bold,
  });

  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const mobileAds = getMobileAds();
    if (mobileAds) {
      mobileAds().initialize();
    }
  }, []);

  useEffect(() => {
    async function checkOnboarding() {
      if (!navigationState?.key || !fontsLoaded) return;
      const hasCompleted = await AsyncStorage.getItem("hasCompletedOnboarding");
      const inOnboardingGroup = segments[0] === "onboarding";

      if (hasCompleted !== "true" && !inOnboardingGroup) {
        router.replace("/onboarding");
      }
    }
    checkOnboarding();
  }, [navigationState?.key, fontsLoaded, segments]);

  useEffect(() => {
    hydrateApiBaseOverride();
    initI18n();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <PricesProvider>
            <InnerLayout />
          </PricesProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

function InnerLayout() {
  const { inAppAlert } = useNotifications();
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
      {inAppAlert ? (
        <View style={[styles.bannerWrap, { top: insets.top + 8 }]}>
          <MarketMovingBanner message={inAppAlert} />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  bannerWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 50,
  },
});
