import './globals.css';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'TrustOS',
    template: '%s | TrustOS',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <header className="site-header">
          <span className="brand">TrustOS</span>
        </header>
        <main id="main-content" className="site-main" tabIndex={-1}>
          {children}
        </main>
        <footer className="site-footer">
          <a href="/accessibility">Accessibility</a> · <a href="/privacy">Privacy</a>
        </footer>
      </body>
    </html>
  );
}