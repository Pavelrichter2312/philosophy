import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';

export const metadata: Metadata = {
  title: 'Job Platforms Tracker',
  description: 'Financial metrics and earnings tracking for public job platforms worldwide',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="max-w-grid mx-auto px-4 sm:px-6 py-8 min-h-[60vh]">
          {children}
        </main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
