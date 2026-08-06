'use client';

import Link from 'next/link';
import { useLang } from '@/contexts/LanguageContext';

export default function NotFound() {
  const { lang } = useLang();
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: 'clamp(3rem, 10vw, 6rem)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
        404 Error
      </p>
      <p style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)', color: 'var(--text-secondary)' }}>
        {lang === 'zh'
          ? '「前面的區域，以後再來探索吧！」'
          : '"How about we explore the area ahead of us later?"'}
      </p>
      <Link
        href="/"
        style={{
          marginTop: '0.5rem',
          padding: '10px 24px',
          background: 'var(--accent-blue)',
          color: 'white',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
        }}
      >
        {lang === 'zh' ? '回到主頁' : 'Back to Home'}
      </Link>
    </div>
  );
}
