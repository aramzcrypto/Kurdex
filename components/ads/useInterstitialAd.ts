import { useEffect, useRef } from "react";
import { AD_UNITS, AD_REQUEST_OPTIONS } from "../../constants/adUnits";
import { getAdsModule } from "./adsRuntime";

export function useInterstitialAd() {
  const ads = getAdsModule();
  const lastShownRef = useRef<number>(0);
  const countRef = useRef<number>(0);
  const loadedRef = useRef<boolean>(false);
  const interstitialRef = useRef(
    ads?.InterstitialAd?.createForAdRequest(
      AD_UNITS.INTERSTITIAL,
      AD_REQUEST_OPTIONS
    )
  );

  useEffect(() => {
    if (!ads || !interstitialRef.current) return;
    const unsubLoaded = interstitialRef.current.addAdEventListener(
      ads.AdEventType.LOADED,
      () => {
        loadedRef.current = true;
      }
    );
    const unsubClosed = interstitialRef.current.addAdEventListener(
      ads.AdEventType.CLOSED,
      () => {
        loadedRef.current = false;
        interstitialRef.current.load();
      }
    );
    interstitialRef.current.load();
    return () => {
      unsubLoaded();
      unsubClosed();
    };
  }, []);

  const onConversionPerformed = () => {
    if (!ads || !interstitialRef.current) return;
    countRef.current += 1;
    if (countRef.current % 5 !== 0) return;
    const now = Date.now();
    const elapsed = now - lastShownRef.current;
    if (elapsed < 30_000) return;

    if (!loadedRef.current) return;
    interstitialRef.current.show();
    lastShownRef.current = now;
  };

  return { onConversionPerformed };
}
