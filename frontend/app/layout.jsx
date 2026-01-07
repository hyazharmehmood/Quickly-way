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
  title: 'Quicklyway',
  description: 'A modern freelance platform',
};

import { AuthInitializer } from '@/components/auth/AuthInitializer';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <AuthInitializer>
          {children}
        </AuthInitializer>
      </body>
    </html>
  );
}

