import type { Metadata } from 'next';
import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

export const metadata: Metadata = {
  title: 'Kurdex | Live Iraqi Dinar Markets',
  description: 'Track Iraqi Dinar market rates, crypto, and commodities with real-time charts and alerts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="site-main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
