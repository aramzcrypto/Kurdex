export default function PrivacyPage() {
  return (
    <div className="container section">
      <div className="panel">
        <h1 className="section-title">Privacy Policy</h1>
        <p className="section-sub">Effective Date: March 29, 2026</p>
        <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
          <p>
            Kurdex Markets provides real-time currency and commodity information. We only collect the data
            required to operate the service, deliver alerts, and maintain account security.
          </p>
          <div>
            <h3>Information We Collect</h3>
            <ul style={{ marginTop: 8, marginLeft: 18 }}>
              <li>Account email and password (stored as a secure hash).</li>
              <li>Anonymous device push tokens for price alerts.</li>
              <li>Usage analytics to improve performance and reliability.</li>
            </ul>
          </div>
          <div>
            <h3>How We Use Data</h3>
            <p>We use your data to authenticate you, sync alerts, and provide reliable market updates.</p>
          </div>
          <div>
            <h3>Third-Party Services</h3>
            <p>We use trusted data sources such as CoinGecko and metals pricing providers. No personal data is shared with those sources.</p>
          </div>
          <div>
            <h3>Contact</h3>
            <p>Email support@kurdex.app for any privacy concerns.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
