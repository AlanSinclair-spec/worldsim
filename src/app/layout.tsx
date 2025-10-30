import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'),
  title: 'WorldSim - El Salvador Digital Twin',
  description: 'Digital twin simulation platform for El Salvador enabling infrastructure, energy, climate, and economic scenario modeling',
  icons: {
    icon: '/favicon.svg',
    apple: '/logo-icon.svg',
  },
  openGraph: {
    title: 'WorldSim - El Salvador Digital Twin | Policy Flight Simulator',
    description: 'Test the future before living it. Run climate, energy, water & agriculture simulations across El Salvador\'s 14 departments. AI-powered insights, ML predictions, and cabinet-ready recommendations in 10 seconds.',
    images: ['/logo-icon.svg'],
    type: 'website',
    siteName: 'WorldSim',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WorldSim - Policy Flight Simulator for Governments',
    description: 'Test critical scenarios across El Salvador - see which regions fail first in 10 seconds. AI insights + ML forecasts + beautiful maps.',
    images: ['/logo-icon.svg'],
    creator: '@worldsim',
    site: '@worldsim',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WorldSim',
  },
};

/**
 * Root layout component
 *
 * Provides:
 * - Global styles
 * - Font configuration
 * - Metadata
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://api.mapbox.com" />
        <link rel="dns-prefetch" href="https://api.mapbox.com" />
        <link rel="preconnect" href="https://tpnvfapdqkbbxkivqjds.supabase.co" />
        <link rel="dns-prefetch" href="https://tpnvfapdqkbbxkivqjds.supabase.co" />

        {/* Preload critical assets */}
        <link rel="preload" href="/regions.json" as="fetch" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  );
}
