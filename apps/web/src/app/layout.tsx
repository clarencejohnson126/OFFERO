import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import type { ReactNode } from 'react';

import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Offero — Bewerbungs-Websites, eine pro Stelle',
  description: 'Maßgeschneiderte Bewerbungs-Websites — in Minuten generiert.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className={`${inter.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
