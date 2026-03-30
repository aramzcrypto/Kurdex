import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { getApiBaseUrl } from "../constants/api";

export interface HistoryPoint {
  timestamp: string;
  buy: number | null;
  sell: number | null;
  mid: number | null;
  source: string | null;
}


export function useHistory(pair: string, range: string, interval?: string, limit?: number) {
  const [data, setData] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const API_BASE_URL = getApiBaseUrl();
      const params: string[] = [];
      if (range) params.push(`range=${encodeURIComponent(range)}`);
      if (interval) params.push(`interval=${encodeURIComponent(interval)}`);
      if (limit) params.push(`limit=${encodeURIComponent(String(limit))}`);
      const query = params.length ? `?${params.join("&")}` : "";
      const res = await axios.get<HistoryPoint[]>(
        `${API_BASE_URL}/api/history/${pair}${query}`,
        { timeout: 10000 }
      );
      setData(res.data);
      setError(null);
    } catch (_err) {
      setError("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [pair, range, interval, limit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { data, loading, error, refresh: fetchHistory };
}
