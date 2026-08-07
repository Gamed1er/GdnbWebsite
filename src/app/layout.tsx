import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import SessionProvider from '@/components/SessionProvider';
import UserWidget from '@/components/UserWidget';
import { LanguageProvider } from '@/contexts/LanguageContext';

export const metadata: Metadata = {
  title: {
    template: '%s | 遊戲亡',
    default: '遊戲亡 | Minecraft 地圖・遊戲開發・影音創作',
  },
  description: 'Minecraft 地圖下載、遊戲開發作品集、影音創作 — 遊戲亡的個人網站',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://gdnb.net'),
  openGraph: {
    siteName: '遊戲亡',
    images: [{ url: '/images/og_tags.png', width: 1200, height: 630 }],
    locale: 'zh_TW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/images/og_tags.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SessionProvider>
          <LanguageProvider>
          <Navbar />
          <main>{children}</main>
          <UserWidget />
          <footer
            style={{
              borderTop: '1px solid var(--border)',
              padding: '2rem 1.5rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              marginTop: '4rem',
            }}
          >
            <p>© {new Date().getFullYear()} 遊戲亡 · gdnb.net</p>
          </footer>
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
