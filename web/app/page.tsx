import Link from 'next/link';

export default function Home() {
  return (
    <>
      <section
        className="hero"
        style={{
          ['--hero-image' as any]: "url('https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=2000&q=80')",
        }}
      >
        <div className="container hero-inner">
          <span className="hero-eyebrow">Live Iraqi Dinar Markets</span>
          <h1 className="hero-title">Kurdex keeps Iraqi Dinar pricing transparent, live, and trusted.</h1>
          <p className="hero-copy">
            Track black market and bank rates, gold, oil, and crypto with one feed built for Kurdistan. No noise, no delay—just the prices you need.
          </p>
          <div className="hero-actions">
            <Link href="/app" className="btn btn-primary">Open Live Dashboard</Link>
            <Link href="/markets" className="btn btn-secondary">Explore Markets</Link>
          </div>
        </div>
      </section>

      <section className="container section">
        <h2 className="section-title">One market view for every decision.</h2>
        <p className="section-sub">Kurdex blends local trading floors with global data sources to keep your rates accurate and actionable.</p>
        <div className="feature-grid">
          <div className="feature-block">
            <h3>Live IQD Signals</h3>
            <p>Black market and bank rates, refreshed continuously from trusted sources across Iraq.</p>
          </div>
          <div className="feature-block">
            <h3>Commodity Watch</h3>
            <p>Gold, silver, and oil tracking with clean price breakdowns and trend visibility.</p>
          </div>
          <div className="feature-block">
            <h3>Crypto Coverage</h3>
            <p>Top crypto assets with searchable listings and real-time percent moves.</p>
          </div>
          <div className="feature-block">
            <h3>Alerts & History</h3>
            <p>Create price alerts and visualize past movements with interactive charts.</p>
          </div>
        </div>
      </section>

      <section className="container section">
        <h2 className="section-title">Built for speed, clarity, and trust.</h2>
        <p className="section-sub">A focused interface designed for operators, traders, and anyone who needs the Iraqi Dinar pulse right now.</p>
        <div className="panel">
          <div className="dashboard-grid">
            <div className="metric">
              <span className="metric-label">Sources</span>
              <span className="metric-value">5+ verified feeds</span>
            </div>
            <div className="metric">
              <span className="metric-label">Refresh</span>
              <span className="metric-value">8s live cadence</span>
            </div>
            <div className="metric">
              <span className="metric-label">Coverage</span>
              <span className="metric-value">FX, metals, oil, crypto</span>
            </div>
            <div className="metric">
              <span className="metric-label">Built for</span>
              <span className="metric-value">Kurdistan markets</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <h2 className="section-title">Ready to monitor the market?</h2>
        <p className="section-sub">Open the live dashboard on web or download the app for alerts and instant updates.</p>
        <div className="hero-actions">
          <Link href="/app" className="btn btn-primary">Go to Dashboard</Link>
          <Link href="/support" className="btn btn-secondary">Contact Support</Link>
        </div>
      </section>
    </>
  );
}
