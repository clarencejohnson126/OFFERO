import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'Offero — Bewerbungs-Websites, eine pro Stelle',
  description: 'Maßgeschneiderte Bewerbungs-Websites — in Minuten generiert.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      {/* suppressHydrationWarning: Browser-Erweiterungen (z. B. data-gptw) hängen Attribute an
          <body> und lösen sonst eine harmlose Hydration-Warnung aus. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
