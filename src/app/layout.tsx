import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { GalleryRefreshProvider } from '@/contexts/GalleryRefreshContext';
import { TextToImageProvider } from '@/contexts/TextToImageContext';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hair Makeover Generator',
  description: 'Generate hair makeovers with AI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background">
        <GalleryRefreshProvider>
          <TextToImageProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              {children}
              <Footer />
            </div>
          </TextToImageProvider>
        </GalleryRefreshProvider>
      </body>
    </html>
  );
}
