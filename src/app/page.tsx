import Link from 'next/link';
import { Play, Package, BookOpen, Video, Gamepad2 } from 'lucide-react';
import HeroImage from '@/components/HeroImage';

// 首頁各分區的介紹卡片
const sections = [
  {
    href: '/portfolio',
    icon: Gamepad2,
    title: '作品集',
    description: '遊戲開發、資工專案，附上 GitHub 連結和說明',
    color: '#3b82f6',
  },
  {
    href: '/minecraft',
    icon: Package,
    title: 'MC 創作下載',
    description: '我製作的 Minecraft 地圖，免費下載',
    color: '#22c55e',
  },
  {
    href: '/blog',
    icon: BookOpen,
    title: '部落格',
    description: '分享一些有用的教學、心得和想法',
    color: '#a855f7',
  },
  {
    href: '/videos',
    icon: Video,
    title: '影片',
    description: '我的 YouTube 頻道影片，隨時更新',
    color: '#ef4444',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero 區域 */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '420px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* 背景圖片 — 把你的圖片放到 public/images/hero/hero.jpg */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #0d1b2a 0%, #1a2d4a 50%, #0f1117 100%)',
          }}
        />
        {/* 如果有放圖片就會顯示，否則 fallback 到漸層背景 */}
        <HeroImage />

        {/* 遮罩 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(15,17,23,0.3) 0%, rgba(15,17,23,0.8) 100%)',
          }}
        />

        {/* 標語文字 */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            textAlign: 'center',
            padding: '2rem 1.5rem',
          }}
        >
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 900,
              color: '#ffffff',
              textShadow: '0 2px 20px rgba(0,0,0,0.8)',
              marginBottom: '1rem',
              letterSpacing: '-0.01em',
            }}
          >
            嗨，我是遊戲亡
          </h1>
          <p
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
              color: 'rgba(255,255,255,0.75)',
              maxWidth: '600px',
              margin: '0 auto 2rem',
              lineHeight: 1.6,
            }}
          >
            Minecraft 地圖開發・遊戲創作・影音剪輯
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/minecraft"
              style={{
                padding: '10px 24px',
                background: 'var(--accent-blue)',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                transition: 'background 0.2s',
              }}
            >
              下載地圖
            </Link>
            <Link
              href="https://www.youtube.com/@gdnb_v2.0"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '10px 24px',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              ▶ YouTube
            </Link>
          </div>
        </div>
      </section>

      {/* 分區導覽卡片 */}
      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '4rem 1.5rem',
        }}
      >
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '2rem',
            textAlign: 'center',
          }}
        >
          這裡有什麼？
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="card"
                  style={{
                    padding: '1.75rem',
                    cursor: 'pointer',
                    height: '100%',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: `${section.color}22`,
                      border: `1px solid ${section.color}44`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem',
                      color: section.color,
                    }}
                  >
                    <Icon size={22} />
                  </div>
                  <h3
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {section.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                    }}
                  >
                    {section.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 關於我 */}
      <section
        style={{
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: '4rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '700px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '1rem',
              color: 'var(--text-primary)',
            }}
          >
            關於我
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              fontSize: '1rem',
            }}
          >
            嗨，我是遊戲亡，一個熱愛 Minecraft 地圖開發和遊戲創作的大學生。
            目前在學習資訊工程，同時在 YouTube 上分享遊戲相關內容。
            這個網站是我的作品集和創作基地。
          </p>
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              marginTop: '1.5rem',
              flexWrap: 'wrap',
            }}
          >
            {['Minecraft 地圖', '遊戲開發', '影音剪輯', 'Unity', 'C#', 'Python'].map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
