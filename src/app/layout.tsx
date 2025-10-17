import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WorldSim - El Salvador Digital Twin',
  description: 'Digital twin simulation platform for El Salvador enabling infrastructure, energy, climate, and economic scenario modeling',
  icons: {
    icon: '/favicon.svg',
    apple: '/logo-icon.svg',
  },
  openGraph: {
    title: 'WorldSim - El Salvador Digital Twin',
    description: 'Test the future before living it. Simulate infrastructure, energy, and climate scenarios for El Salvador.',
    images: ['/logo-icon.svg'],
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
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  );
}
