import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Luminous Sign Video Generator',
  description: 'Generate cinematic commercial videos from photos of luminous signs using Veo AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-zinc-950 text-zinc-200 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
