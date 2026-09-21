'use client';

import Link from 'next/link';
import { Wand2, Captions, ArrowRight } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { ui } from '@/lib/i18n';

export default function ToolsPage() {
  const { lang } = useLang();
  const t = ui[lang].tools;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{t.title}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t.subtitle}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <Link
          href="/tools/image-background-removal"
          className="card"
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', textDecoration: 'none' }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: 'rgba(59,130,246,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-blue-light)',
            }}
          >
            <Wand2 size={24} />
          </div>

          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              {t.imageBackgroundRemoval.title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {t.imageBackgroundRemoval.description}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-blue-light)', fontSize: '0.85rem', fontWeight: 600, marginTop: 'auto' }}>
            {t.useTool} <ArrowRight size={14} />
          </div>
        </Link>

        <Link
          href="/tools/video-subtitle-extraction"
          className="card"
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', textDecoration: 'none' }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: 'rgba(59,130,246,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-blue-light)',
            }}
          >
            <Captions size={24} />
          </div>

          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              {t.videoSubtitleExtraction.title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {t.videoSubtitleExtraction.description}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-blue-light)', fontSize: '0.85rem', fontWeight: 600, marginTop: 'auto' }}>
            {t.useTool} <ArrowRight size={14} />
          </div>
        </Link>
      </div>
    </div>
  );
}
