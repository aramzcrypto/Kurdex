import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { AD_UNITS, AD_REQUEST_OPTIONS } from "../../constants/adUnits";
import { getAdsModule } from "./adsRuntime";

export function useAppOpenAd() {
  const ads = getAdsModule();
  const lastShownRef = useRef<number>(0);
  const appOpenRef = useRef(
    ads?.AppOpenAd?.createForAdRequest(AD_UNITS.APP_OPEN, AD_REQUEST_OPTIONS)
  );

  useEffect(() => {
    if (!ads || !appOpenRef.current) return;
    const unsub = appOpenRef.current.addAdEventListener(
      ads.AdEventType.LOADED,
      () => {}
    );
    appOpenRef.current.load();
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!ads || !appOpenRef.current) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      const now = Date.now();
      const elapsedHours = (now - lastShownRef.current) / 3_600_000;
      if (elapsedHours < 4) return;

      appOpenRef.current.show();
      lastShownRef.current = now;
      appOpenRef.current.load();
    });
    return () => sub.remove();
  }, []);
}
