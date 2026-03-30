export default function TermsPage() {
  return (
    <div className="container section">
      <div className="panel">
        <h1 className="section-title">Terms of Service</h1>
        <p className="section-sub">Last updated: March 29, 2026</p>
        <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
          <p>
            Kurdex Markets provides informational market data and does not offer financial advice. Use the
            service at your own discretion.
          </p>
          <div>
            <h3>Use of Service</h3>
            <p>You agree to use Kurdex only for lawful purposes and not to misuse the data feeds.</p>
          </div>
          <div>
            <h3>Data Accuracy</h3>
            <p>Market data is sourced from third parties and may not be 100% accurate or up to date.</p>
          </div>
          <div>
            <h3>Account Responsibility</h3>
            <p>You are responsible for keeping your login credentials secure.</p>
          </div>
          <div>
            <h3>Contact</h3>
            <p>Email support@kurdex.app for questions regarding these terms.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
