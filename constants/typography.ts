import { I18nManager } from "react-native";

export const FONTS = {
  regular: I18nManager.isRTL ? "NotoSansArabic_400Regular" : "Inter_400Regular",
  medium: I18nManager.isRTL ? "NotoSansArabic_500Medium" : "Inter_500Medium",
  semibold: I18nManager.isRTL ? "NotoSansArabic_600SemiBold" : "Inter_600SemiBold",
  bold: I18nManager.isRTL ? "NotoSansArabic_700Bold" : "Inter_700Bold",
};

export const isRTL = I18nManager.isRTL;
