'use client';

import { useEffect, useMemo, useState } from 'react';
import HistoryChart from '../components/HistoryChart';

interface Prices {
  usdIqdBlack: { mid: number };
  usdIqdBank: { mid: number } | null;
  otherPairs: Array<{ pair: string; mid: number }>;
  gold: { spotUsdPerOz: number; iqd21k?: number };
  silver: { spotUsdPerOz: number };
  oil?: { wti?: { priceUsd: number } | null; brent?: { priceUsd: number } | null } | null;
  crypto: Array<{ symbol: string; priceUsd: number }>;
}

const RANGE_OPTIONS = ['1h', '24h', '7d', '30d'];

export default function MarketsPage() {
  const [prices, setPrices] = useState<Prices | null>(null);
  const [range, setRange] = useState('24h');
  const [pair, setPair] = useState('USD_IQD_BLACK');

  useEffect(() => {
    const fetchPrices = async () => {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';
      const res = await fetch(`${base}/api/prices`);
      const json = await res.json();
      setPrices(json);
    };
    fetchPrices();
  }, []);

  const options = useMemo(() => {
    if (!prices) return [];
    const opts = [
      { label: 'USD/IQD (Market)', value: 'USD_IQD_BLACK' },
      { label: 'USD/IQD (Bank)', value: 'USD_IQD_BANK' },
      ...prices.otherPairs.map((p) => ({ label: p.pair, value: p.pair.replace('/', '_') })),
      { label: 'Gold (USD/Oz)', value: 'GOLD_USD_OZ' },
      { label: 'Gold 21K (IQD)', value: 'GOLD_IQD_21K' },
      { label: 'Silver (USD/Oz)', value: 'SILVER_USD_OZ' },
      { label: 'WTI Crude (USD)', value: 'OIL_WTI_USD' },
      { label: 'Brent Crude (USD)', value: 'OIL_BRENT_USD' },
      ...prices.crypto.slice(0, 20).map((c) => ({ label: `${c.symbol.toUpperCase()} (USD)`, value: `${c.symbol.toUpperCase()}_USD` })),
    ];
    return opts;
  }, [prices]);

  return (
    <div className="container section">
      <div className="panel">
        <div className="chart-header">
          <div>
            <h1 className="section-title">Markets</h1>
            <p className="section-sub">Pick any asset and explore its historical performance.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <select className="form-control" value={pair} onChange={(e) => setPair(e.target.value)}>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="range-buttons">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  className={`range-button ${range === opt ? 'active' : ''}`}
                  onClick={() => setRange(opt)}
                >
                  {opt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
        <HistoryChart pair={pair} range={range} title={options.find((o) => o.value === pair)?.label || pair} />
      </div>
    </div>
  );
}
