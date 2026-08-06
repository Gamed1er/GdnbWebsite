'use client';

import Link from 'next/link';
import { Package, BookOpen, Video, Gamepad2 } from 'lucide-react';
import HeroImage from '@/components/HeroImage';
import GithubIcon from '@/components/icons/GithubIcon';
import { useLang } from '@/contexts/LanguageContext';

const sections = {
  zh: [
    { href: '/portfolio', icon: Gamepad2, title: '作品集', description: '遊戲開發、資工專案，附上 GitHub 連結和說明', color: '#3b82f6' },
    { href: '/minecraft', icon: Package, title: 'MC 創作下載', description: '我製作的 Minecraft 地圖，免費下載', color: '#22c55e' },
    { href: '/blog', icon: BookOpen, title: '部落格', description: '分享一些有用的教學、心得和想法', color: '#a855f7' },
    { href: '/videos', icon: Video, title: '影片', description: '我的 YouTube 頻道影片，隨時更新', color: '#ef4444' },
  ],
  en: [
    { href: '/portfolio', icon: Gamepad2, title: 'Portfolio', description: 'Game dev & CS projects with GitHub links and write-ups', color: '#3b82f6' },
    { href: '/minecraft', icon: Package, title: 'MC Map Downloads', description: 'Minecraft maps I made — free to download', color: '#22c55e' },
    { href: '/blog', icon: BookOpen, title: 'Blog', description: 'Tutorials, thoughts, and things I find worth sharing', color: '#a855f7' },
    { href: '/videos', icon: Video, title: 'Videos', description: 'My YouTube channel, synced automatically', color: '#ef4444' },
  ],
};

const t = {
  zh: {
    heroSub: 'Hi, I\'m Gdnb',
    heroTitle: '嗨，我是遊戲亡',
    heroDesc: '遊戲開發工程師・Minecraft 地圖創作・影音剪輯',
    heroCta: '查看作品集',
    aboutTitle: '關於我',
    about1: '嗨，我是遊戲亡（Gdnb），目前就讀於中央大學。我熱衷於遊戲開發，希望有一天能做出一款令人印象深刻的作品。',
    about2: '我參加各種大大小小的 Game Jam，目前已開發出數個遊戲。有時靈感一來，就會一頭栽進去做整個遊戲或 Minecraft 地圖——停不下來的那種。',
    about3: '除了開發，我最近也在學習美術和 3D 建模，並開始接觸競技程式設計。歡迎隨時找我交流！',
    sectionTitle: '這裡有什麼？',
    tags: ['遊戲開發', 'Minecraft 地圖', 'Unity', 'C#', 'Python', '影音剪輯', '3D 建模', 'Game Jam'],
  },
  en: {
    heroSub: 'Hi, I\'m Gdnb',
    heroTitle: 'Hi, I\'m Gdnb',
    heroDesc: 'Game Developer · Minecraft Datapack Developer · Video & Audio Editing',
    heroCta: 'View Portfolio',
    aboutTitle: 'About Me',
    about1: "Hi, I'm Gdnb, currently studying at National Central University. I'm passionate about game development and hope to create something truly impressive someday.",
    about2: "I participate in all kinds of Game Jams and have shipped several games. Sometimes an idea hits and I just dive in — building a whole game or Minecraft map before I even realize it.",
    about3: "Lately I've been picking up art and 3D modeling, and I recently started getting into competitive programming. Feel free to reach out anytime!",
    sectionTitle: "What's Here?",
    tags: ['Game Dev', 'Minecraft Maps', 'Unity', 'C#', 'Python', 'Video Editing', '3D Modeling', 'Game Jam'],
  },
};

const socialLinks = [
  {
    href: 'https://github.com/Gamed1er',
    label: 'GitHub',
    icon: <GithubIcon size={17} />,
  },
  {
    href: 'https://www.youtube.com/@gdnb_v2.0',
    label: 'YouTube',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
      </svg>
    ),
  },
  {
    href: 'https://discord.gg/wYKM6VZ4kd',
    label: 'Discord',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.3 4.4A19.4 19.4 0 0 0 15.6 3c-.2.4-.5.9-.6 1.3a18 18 0 0 0-5.5 0A13.5 13.5 0 0 0 8.9 3a19.4 19.4 0 0 0-4.7 1.4C1.5 8.3.6 12 1.1 15.7a19.6 19.6 0 0 0 5.9 3c.5-.6.9-1.3 1.3-2a12.7 12.7 0 0 1-2-.9l.5-.4a14 14 0 0 0 12 0l.5.4a12.8 12.8 0 0 1-2 1c.4.7.8 1.4 1.2 2a19.5 19.5 0 0 0 6-3c.5-4.3-.7-8-3.2-11.3zM8.5 13.4c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4zm7 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4z"/>
      </svg>
    ),
  },
];

export default function HomePage() {
  const { lang } = useLang();
  const tr = t[lang];
  const secs = sections[lang];

  return (
    <div>
      {/* Hero — 扣掉 Navbar 56px，剛好填滿視窗 */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          height: 'calc(100vh - 64px)',
          minHeight: '480px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #0d1b2a 0%, #1a2d4a 50%, #0f1117 100%)',
          }}
        />
        <HeroImage />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(15,17,23,0.1) 0%, rgba(15,17,23,0.7) 60%, rgba(15,17,23,0.95) 100%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '0 3rem 4rem',
            maxWidth: '860px',
          }}
        >
          <p
            style={{
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.45)',
              marginBottom: '0.6rem',
              letterSpacing: '0.06em',
            }}
          >
            {tr.heroSub}
          </p>
          <h1
            style={{
              fontSize: 'clamp(2.8rem, 6vw, 5rem)',
              fontWeight: 900,
              color: '#ffffff',
              textShadow: '0 2px 28px rgba(0,0,0,0.7)',
              marginBottom: '1rem',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
            }}
          >
            {tr.heroTitle}
          </h1>
          <p
            style={{
              fontSize: 'clamp(1rem, 2.2vw, 1.25rem)',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.7,
              marginBottom: '2.25rem',
            }}
          >
            {tr.heroDesc}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              href="/portfolio"
              style={{
                padding: '11px 26px',
                background: 'var(--accent-blue)',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
              }}
            >
              {tr.heroCta}
            </Link>
            <Link
              href="https://www.youtube.com/@gdnb_v2.0"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '11px 26px',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
              }}
            >
              ▶ YouTube
            </Link>
          </div>
        </div>
      </section>

      {/* 關於我 */}
      <section
        style={{
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: '5rem 2rem',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 700, marginBottom: '1.75rem', color: 'var(--text-primary)' }}>
            {tr.aboutTitle}
          </h2>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.9, fontSize: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p>{tr.about1}</p>
            <p>{tr.about2}</p>
            <p>{tr.about3}</p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            {tr.tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem', flexWrap: 'wrap' }}>
            {socialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '8px 16px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  transition: 'border-color 0.2s, color 0.2s',
                }}
              >
                {link.icon}
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 這裡有什麼？ */}
      <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '5rem 2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2rem', textAlign: 'center' }}>
          {tr.sectionTitle}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {secs.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: '1.75rem', cursor: 'pointer', height: '100%' }}>
                  <div
                    style={{
                      width: '44px', height: '44px', borderRadius: '10px',
                      background: `${section.color}22`, border: `1px solid ${section.color}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '1rem', color: section.color,
                    }}
                  >
                    <Icon size={22} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {section.title}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {section.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <style>{`
        .social-link:hover {
          border-color: rgba(255,255,255,0.3) !important;
          color: var(--text-primary) !important;
        }
      `}</style>
    </div>
  );
}
