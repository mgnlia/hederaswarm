import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HederaSwarm | Multi-Agent DeFi on Hedera',
  description: 'AI agents coordinate via Hedera Consensus Service to execute DeFi operations on-chain',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-white min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
