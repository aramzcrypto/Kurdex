import React, { useState } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { COLORS } from "../../constants/colors";
import { AD_REQUEST_OPTIONS } from "../../constants/adUnits";
import { getAdsModule } from "./adsRuntime";

interface BannerAdUnitProps {
  unitId: string;
  style?: ViewStyle;
}

export function BannerAdUnit({ unitId, style }: BannerAdUnitProps) {
  const [failed, setFailed] = useState(false);
  const ads = getAdsModule();
  if (!ads) return null;
  const { BannerAd, BannerAdSize } = ads;

  if (failed) return null;

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ADAPTIVE_BANNER}
        requestOptions={AD_REQUEST_OPTIONS}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.separator,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
});
