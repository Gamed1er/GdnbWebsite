'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Globe } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

const navLinks = [
  { href: '/', label: '主頁' },
  { href: '/blog', label: '部落格' },
  { href: '/portfolio', label: '作品集' },
  { href: '/minecraft', label: 'MC 創作下載' },
  { href: '/videos', label: '影片' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, toggle } = useLang();

  return (
    <nav
      style={{
        background: 'var(--bg-nav)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          {/* Minecraft 風格 icon 區域 */}
          <div
            style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #4a7c3f 0%, #2d5a27 50%, #1a3a17 100%)',
              border: '2px solid #6aad5a',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              imageRendering: 'pixelated',
            }}
          >
            🎮
          </div>
          <span
            style={{
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '1.2rem',
              letterSpacing: '0.02em',
            }}
          >
            遊戲亡
          </span>
        </Link>

        {/* 桌面導覽 */}
        <div
          className="desktop-nav"
          style={{
            display: 'flex',
            gap: '0.25rem',
            alignItems: 'center',
          }}
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  color: isActive ? 'var(--accent-blue-light)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  borderBottom: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.target as HTMLElement).style.color = 'var(--text-primary)';
                    (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.target as HTMLElement).style.color = 'var(--text-secondary)';
                    (e.target as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                {link.label}
              </Link>
            );
          })}

          {/* 語言切換 */}
          <button
            onClick={toggle}
            title={lang === 'zh' ? 'Switch to English' : '切換為中文'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginLeft: '4px',
              padding: '5px 11px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.02em',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
            }}
          >
            <Globe size={13} />
            {lang === 'zh' ? 'EN' : '中文'}
          </button>
        </div>

        {/* 手機漢堡選單 */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
          }}
          className="mobile-menu-btn"
          aria-label="選單"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 手機展開選單 */}
      {mobileOpen && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            padding: '0.5rem 1.5rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
          className="mobile-nav"
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: isActive ? 'var(--accent-blue-light)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  fontSize: '0.95rem',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
        @media (min-width: 769px) {
          .mobile-nav { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
