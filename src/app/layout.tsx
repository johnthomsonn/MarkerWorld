import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MarkerWorld - Collaborative 3D Earth & Geospatial Intelligence',
  description: 'Explore the globe, pin markers with photos and descriptions, resolve issues, and create isolated worlds to share with collaborators via invite codes.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Plus Jakarta Sans', var(--font-main)" }}>
        {children}
      </body>
    </html>
  );
}
