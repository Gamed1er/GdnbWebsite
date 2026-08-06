import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import SessionProvider from '@/components/SessionProvider';

export const metadata: Metadata = {
  title: {
    template: '%s | 遊戲亡',
    default: '遊戲亡 | Minecraft 地圖・遊戲開發・影音創作',
  },
  description: 'Minecraft 地圖下載、遊戲開發作品集、影音創作 — 遊戲亡的個人網站',
  metadataBase: new URL('https://gdnb.net'),
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
          <Navbar />
          <main>{children}</main>
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
        </SessionProvider>
      </body>
    </html>
  );
}
