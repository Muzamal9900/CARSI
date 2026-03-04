import type { Metadata } from 'next';
import { Outfit, DM_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toast';
import { ThemeProvider } from '@/components/ThemeProvider';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CARSI | Restoration Training — IICRC CEC Platform',
  description:
    'IICRC-aligned CEC training for cleaning and restoration professionals. Earn recognised credits, track your progress.',
  keywords: 'restoration training, IICRC CECs, water restoration, CARSI',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" className="dark" suppressHydrationWarning>
      <body className={`${outfit.variable} ${dmSans.variable} font-sans`} suppressHydrationWarning>
        <ThemeProvider initialTheme="dark">
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
