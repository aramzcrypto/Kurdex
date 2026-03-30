import { useEffect, useRef, useState } from "react";
import { AD_UNITS, AD_REQUEST_OPTIONS } from "../../constants/adUnits";
import { getAdsModule } from "./adsRuntime";

interface RewardedOptions {
  onRewardEarned: () => void;
}

export function useRewardedAd({ onRewardEarned }: RewardedOptions) {
  const ads = getAdsModule();
  const [isLoaded, setIsLoaded] = useState(false);
  const rewardedRef = useRef(
    ads?.RewardedAd?.createForAdRequest(AD_UNITS.REWARDED, AD_REQUEST_OPTIONS)
  );

  useEffect(() => {
    if (!ads || !rewardedRef.current) return;
    const unsubLoaded = rewardedRef.current.addAdEventListener(ads.AdEventType.LOADED, () => {
      setIsLoaded(true);
    });

    const unsubReward = rewardedRef.current.addAdEventListener(
      ads.AdEventType.EARNED_REWARD,
      () => {
        onRewardEarned();
      }
    );

    rewardedRef.current.load();

    return () => {
      unsubLoaded();
      unsubReward();
    };
  }, [onRewardEarned]);

  const showRewardedAd = async () => {
    if (!isLoaded) return;
    if (!ads || !rewardedRef.current) return;
    await rewardedRef.current.show();
    setIsLoaded(false);
    rewardedRef.current.load();
  };

  return { showRewardedAd, isLoaded };
}
