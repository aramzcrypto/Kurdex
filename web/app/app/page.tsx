'use client';

import { useEffect, useMemo, useState } from 'react';
import HistoryChart from '../components/HistoryChart';

interface Prices {
  usdIqdBlack: { buy: number; sell: number; mid: number; changePercent24h: number };
  usdIqdBank: { buy: number; sell: number; mid: number } | null;
  gold: { spotUsdPerOz: number; iqd21k?: number };
  silver: { spotUsdPerOz: number };
  oil?: { wti?: { priceUsd: number; changePercent24h: number } | null } | null;
  crypto: Array<{ symbol: string; priceUsd: number; changePercent24h: number }>;
}

const RANGE_OPTIONS = ['1h', '24h', '7d', '30d'];

export default function DashboardPage() {
  const [data, setData] = useState<Prices | null>(null);
  const [range, setRange] = useState('24h');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPrices = async () => {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';
      const res = await fetch(`${base}/api/prices`);
      const json = await res.json();
      setData(json);
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 8000);
    return () => clearInterval(interval);
  }, []);

  const filteredCrypto = useMemo(() => {
    if (!data?.crypto) return [];
    if (!search) return data.crypto.slice(0, 8);
    return data.crypto.filter((c) => c.symbol.toLowerCase().includes(search.toLowerCase())).slice(0, 12);
  }, [data, search]);

  return (
    <div className="container section">
      <div className="panel">
        <div className="chart-header">
          <div>
            <h1 className="section-title">Live Dashboard</h1>
            <p className="section-sub">Track IQD, metals, oil, and crypto in one place.</p>
          </div>
          <input
            className="form-control"
            placeholder="Search crypto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="dashboard-grid" style={{ marginTop: 24 }}>
          <div className="metric">
            <span className="metric-label">USD/IQD Market</span>
            <span className="metric-value">{data?.usdIqdBlack?.mid?.toLocaleString() ?? '--'}</span>
          </div>
          <div className="metric">
            <span className="metric-label">USD/IQD Bank</span>
            <span className="metric-value">{data?.usdIqdBank?.mid?.toLocaleString() ?? '--'}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Gold (USD/Oz)</span>
            <span className="metric-value">{data?.gold?.spotUsdPerOz?.toFixed(2) ?? '--'}</span>
          </div>
          <div className="metric">
            <span className="metric-label">BTC/USD</span>
            <span className="metric-value">
              {data?.crypto?.find((c) => c.symbol.toLowerCase() === 'btc')?.priceUsd?.toLocaleString() ?? '--'}
            </span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="chart-header">
          <div>
            <h2 className="section-title">USD/IQD Market Trend</h2>
            <p className="section-sub">Interactive history across time ranges.</p>
          </div>
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
        <HistoryChart pair="USD_IQD_BLACK" range={range} title="USD/IQD (Market)" />
      </div>

      <div className="panel">
        <div className="chart-header">
          <div>
            <h2 className="section-title">Crypto Pulse</h2>
            <p className="section-sub">Live movers from top assets.</p>
          </div>
        </div>
        <div className="dashboard-grid">
          {filteredCrypto.map((coin) => (
            <div key={coin.symbol} className="metric">
              <span className="metric-label">{coin.symbol.toUpperCase()}</span>
              <span className="metric-value">{coin.priceUsd.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
