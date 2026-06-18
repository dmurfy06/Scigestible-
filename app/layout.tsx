import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { siteUrl } from '@/lib/site-url';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

// AdSense script is intentionally NOT loaded here — it's loaded by AdSlot only
// when a real ad unit renders (after paper digest), so the login/empty screens
// are never flagged as "ads without publisher content".

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: 'Scigestible - Understand Research Papers Quickly',
  description:
    'AI-powered research paper analysis for students. Get summaries, findings, and key concepts from scientific papers instantly.',
  // Google AdSense site-ownership verification (Meta tag method).
  ...(ADSENSE_CLIENT && {
    other: { 'google-adsense-account': ADSENSE_CLIENT },
  }),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
