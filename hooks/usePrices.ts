import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AllPrices } from "../types/prices";
import { getApiBaseCandidates, setApiBaseUrl, getApiBaseUrl } from "../constants/api";

const REFRESH_MS = 8_000;  // Crypto updates every 15s on backend, fetch faster to feel realtime
const CACHE_KEY = "prices_cache";

export function usePrices() {
  const [data, setData] = useState<AllPrices | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      const candidates = getApiBaseCandidates();
      let lastError: any = null;
      for (const candidate of candidates) {
        try {
          const response = await axios.get<AllPrices>(
            `${candidate}/api/prices`,
            {
              timeout: 10_000,
              // No If-None-Match — always fetch fresh data for realtime feel
            }
          );
          setApiBaseUrl(candidate);
          if (response.status === 200) {
            setData(response.data);
            setLastFetched(new Date());
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
            setOffline(false);
          }
          setError(null);
          lastError = null;
          break;
        } catch (err) {
          lastError = err;
        }
      }

      if (lastError) throw lastError;
    } catch (err: any) {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        setData(JSON.parse(cached));
        setOffline(true);
        setError(null);
      } else {
        const msg = err?.message ? `Failed to load prices: ${err.message}` : "Failed to load prices";
        const resolved = getApiBaseUrl();
        setError(`${msg} (API: ${resolved})`);
      }
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchPrices();
    timerRef.current = setInterval(fetchPrices, REFRESH_MS) as unknown as NodeJS.Timeout;
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchPrices]);

  return {
    data,
    lastFetched,
    loading,
    error,
    offline,
    refresh: fetchPrices,
  };
}
