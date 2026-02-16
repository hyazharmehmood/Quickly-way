import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
});

export const metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: {
    default: 'Quicklyway | Service Provider Marketplace',
    template: '%s | Quicklyway'
  },
  description: 'Connect with top service providers and clients on Quicklyway. The fastest growing marketplace for digital services, graphic design, web development, and more.',
  keywords: ['services', 'marketplace', 'hire service providers', 'digital services', 'web development', 'graphic design', 'remote work'],
  authors: [{ name: 'Quicklyway Team' }],
  creator: 'Quicklyway',
  publisher: 'Quicklyway',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://quicklyway.com',
    title: 'Quicklyway | Service Provider Marketplace',
    description: 'Find the perfect service provider for your project on Quicklyway.',
    siteName: 'Quicklyway',
    images: [
      {
        url: '/og-image.png', // Ensure this exists or use a placeholder
        width: 1200,
        height: 630,
        alt: 'Quicklyway Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quicklyway | Service Provider Marketplace',
    description: 'Find the perfect service provider for your project on Quicklyway.',
    images: ['/og-image.png'],
    creator: '@quicklyway',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Quicklyway',
  url: 'https://quicklyway.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://quicklyway.com/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

import { AuthInitializer } from '@/components/auth/AuthInitializer';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Toaster } from '@/components/ui/sonner';
import { NotificationToaster } from '@/components/notifications/NotificationToaster';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${poppins.className} font-sans`} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthInitializer>
          <GlobalHeader />
          {children}
          <Toaster />
          <NotificationToaster />
        </AuthInitializer>
      </body>
    </html>
  );
}

