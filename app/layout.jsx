import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: {
    default: 'Quicklyway | Modern Freelance Marketplace',
    template: '%s | Quicklyway'
  },
  description: 'Connect with top freelancers and clients on Quicklyway. The fastest growing marketplace for digital services, graphic design, web development, and more.',
  keywords: ['freelance', 'marketplace', 'hire freelancers', 'digital services', 'web development', 'graphic design', 'remote work'],
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
    title: 'Quicklyway | Modern Freelance Marketplace',
    description: 'Find the perfect professional for your project on Quicklyway.',
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
    title: 'Quicklyway | Modern Freelance Marketplace',
    description: 'Find the perfect professional for your project on Quicklyway.',
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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthInitializer>
          <GlobalHeader />
          {children}
        </AuthInitializer>
      </body>
    </html>
  );
}

