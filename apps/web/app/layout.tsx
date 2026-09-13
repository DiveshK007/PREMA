import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Prema — Guna Milan',
  description:
    'Check two birth charts against each other, the way your family would. Full 36-point Ashtakoota, computed with the Lahiri ayanamsa.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Never block zoom. The reader is in their fifties; pinch-to-zoom is an
  // accessibility feature, not a layout inconvenience.
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Gentium+Book+Plus:wght@400;700&family=Noto+Serif+Devanagari:wght@400;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
