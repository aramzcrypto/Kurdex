import Link from 'next/link';

export default function SupportPage() {
  return (
    <div className="container section">
      <div className="panel">
        <h1 className="section-title">Support</h1>
        <p className="section-sub">Find quick answers or contact our team.</p>
        <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
          <div>
            <h3>How often do prices update?</h3>
            <p>Every 8 seconds on web, with continuous updates on mobile.</p>
          </div>
          <div>
            <h3>Where do the rates come from?</h3>
            <p>We aggregate local exchange data, Telegram trading desks, and global pricing sources.</p>
          </div>
          <div>
            <h3>Need help?</h3>
            <p>Email support@kurdex.app or use the <Link href="/contact">contact form</Link>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
