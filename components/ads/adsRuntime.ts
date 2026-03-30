import Constants from "expo-constants";
import { Platform } from "react-native";

const isExpoGo = Constants.appOwnership === "expo";
const isAdsDisabled =
  isExpoGo ||
  Platform.OS === "web" ||
  process.env.EXPO_PUBLIC_DISABLE_ADS === "1";

type AdsModule = typeof import("react-native-google-mobile-ads");

let cachedAdsModule: AdsModule | null = null;

export const FALLBACK_TEST_IDS = {
  ADAPTIVE_BANNER: "ca-app-pub-3940256099942544/6300978111",
  INTERSTITIAL: "ca-app-pub-3940256099942544/1033173712",
  APP_OPEN: "ca-app-pub-3940256099942544/3419835294",
  REWARDED: "ca-app-pub-3940256099942544/5224354917",
};

export function getAdsModule(): AdsModule | null {
  if (isAdsDisabled) return null;
  if (!cachedAdsModule) {
    cachedAdsModule = require("react-native-google-mobile-ads");
  }
  return cachedAdsModule;
}

export function getMobileAds() {
  const ads = getAdsModule();
  return ads?.default ?? null;
}

export function getTestIds() {
  const ads = getAdsModule();
  return ads?.TestIds ?? FALLBACK_TEST_IDS;
}
