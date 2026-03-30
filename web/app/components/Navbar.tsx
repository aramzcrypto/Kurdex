'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/app', label: 'Dashboard' },
  { href: '/markets', label: 'Markets' },
  { href: '/support', label: 'Support' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="container nav-inner">
        <Link href="/" className="brand">
          <span className="brand-mark" />
          <span className="brand-text">Kurdex</span>
        </Link>

        <nav className="nav-links">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? 'nav-link active' : 'nav-link'}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="nav-cta">
          <Link href="/app" className="btn btn-primary">
            Open Live Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}
