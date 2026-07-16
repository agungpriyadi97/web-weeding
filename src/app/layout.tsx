import type { Metadata } from 'next';
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const playfair = Playfair_Display({
  variable: '--font-serif',
  subsets: ['latin'],
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'The Wedding of Hery & Irish Bella',
  description: 'Undangan Pernikahan Digital Hery Kurniawan & Irish Bella. Join us in celebrating our special day.',
  openGraph: {
    title: 'The Wedding of Hery & Irish Bella',
    description: 'Undangan Pernikahan Digital Hery & Bella',
    images: [{ url: '/images/cover.png' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${playfair.variable} ${plusJakarta.variable} font-sans antialiased bg-[#FDFBF7] text-[#333333]`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
