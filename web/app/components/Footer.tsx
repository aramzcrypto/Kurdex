import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <p className="footer-brand">Kurdex</p>
          <p className="footer-tag">Iraqi Dinar Markets, live and verified.</p>
        </div>
        <div className="footer-links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/support">Support</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/delete-account">Delete Account</Link>
        </div>
      </div>
      <div className="footer-bottom">© 2026 Kurdex. All rights reserved.</div>
    </footer>
  );
}
