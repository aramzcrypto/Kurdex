'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface HistoryPoint {
  timestamp: string;
  buy: number | null;
  sell: number | null;
  mid: number | null;
  source: string | null;
}

const RANGE_INTERVAL: Record<string, string> = {
  '1h': '5m',
  '24h': '30m',
  '7d': '2h',
  '30d': '6h',
};

function buildPath(values: number[], width: number, height: number) {
  if (values.length < 2) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((val, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
}

export default function HistoryChart({ pair, range, title }: { pair: string; range: string; title?: string }) {
  const [data, setData] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(600);
  const height = 220;

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';
        const interval = RANGE_INTERVAL[range] || '30m';
        const res = await fetch(`${base}/api/history/${pair}?range=${range}&interval=${interval}`);
        const json = await res.json();
        setData(json || []);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [pair, range]);

  const values = useMemo(() => data.map((d) => d.mid ?? d.buy ?? d.sell ?? 0), [data]);
  const stats = useMemo(() => {
    if (!values.length) return { min: 0, max: 0 };
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [values]);
  const path = useMemo(() => buildPath(values, width, height), [values, width]);

  const index = activeIndex ?? Math.max(0, values.length - 1);
  const activeValue = values[index];
  const activeTime = data[index]?.timestamp;

  if (!values.length) {
    return (
      <div className="chart-wrap" ref={containerRef}>
        <div className="chart-header">
          <div>
            <strong>{title}</strong>
            <div className="text-muted">{pair.replace(/_/g, ' ')}</div>
          </div>
          {loading ? <span className="text-muted">Loading...</span> : null}
        </div>
        <div className="panel">No data available.</div>
      </div>
    );
  }

  return (
    <div className="chart-wrap" ref={containerRef}>
      <div className="chart-header">
        <div>
          <strong>{title}</strong>
          <div className="text-muted">{pair.replace(/_/g, ' ')}</div>
        </div>
        {loading ? <span className="text-muted">Loading...</span> : null}
      </div>
      <div
        onMouseMove={(e) => {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          const idx = Math.round((x / rect.width) * (values.length - 1));
          setActiveIndex(Math.max(0, Math.min(values.length - 1, idx)));
        }}
        onMouseLeave={() => setActiveIndex(null)}
        style={{ position: 'relative' }}
      >
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <path d={path} stroke="#f7c948" strokeWidth="2.4" fill="none" />
          {values.length > 1 && activeIndex !== null ? (
            <circle
              cx={(index / (values.length - 1)) * width}
              cy={height - ((activeValue - stats.min) / (stats.max - stats.min || 1)) * height}
              r="4"
              fill="#62d5ff"
            />
          ) : null}
        </svg>
        {activeTime ? (
          <div className="panel" style={{ position: 'absolute', top: 12, right: 12 }}>
            <div className="metric-label">{new Date(activeTime).toLocaleString()}</div>
            <div className="metric-value">{activeValue?.toLocaleString()}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
