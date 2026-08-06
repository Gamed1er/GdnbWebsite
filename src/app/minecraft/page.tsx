'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Download, Package } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { ui } from '@/lib/i18n';

interface MinecraftMap {
  id: number;
  title: string;
  excerpt: string;
  cover_image: string | null;
  file_size: number | null;
  resourcepack_path: string | null;
  version: string | null;
  tags: string[];
  downloads: number;
  created_at: string;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function MinecraftPage() {
  const router = useRouter();
  const { lang } = useLang();
  const t = ui[lang].minecraft;
  const c = ui[lang].common;
  const [maps, setMaps] = useState<MinecraftMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/minecraft')
      .then((r) => r.json())
      .then((data) => { setMaps(data); setLoading(false); });
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    maps.forEach((m) => m.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [maps]);

  const filtered = useMemo(() => maps.filter((m) => {
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase()) || m.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchTag = !activeTag || m.tags.includes(activeTag);
    return matchSearch && matchTag;
  }), [maps, search, activeTag]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{t.title}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t.subtitle}</p>
      </div>

      {/* 搜尋 + 標籤 */}
      <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent-blue)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
        {allTags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{c.tags}</span>
            <button onClick={() => setActiveTag(null)} style={tagBtnStyle(activeTag === null)}>{c.all}</button>
            {allTags.map((tag) => (
              <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} style={tagBtnStyle(activeTag === tag)}>{tag}</button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem 0' }}>{c.loading}</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem 0' }}>{maps.length === 0 ? t.empty : c.noResults}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((map) => (
            <div
              key={map.id}
              className="card"
              style={{ display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer' }}
              onClick={() => router.push(`/minecraft/${map.id}`)}
            >
                {/* 封面圖 */}
                {map.cover_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={map.cover_image} alt={map.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '8px 8px 0 0' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '16/9', background: 'linear-gradient(135deg, #1a3a2a 0%, #0d1f17 100%)', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={40} style={{ color: '#22c55e', opacity: 0.4 }} />
                  </div>
                )}

                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                  {/* 標籤 + 版本 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {map.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
                    </div>
                    {map.version && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                        {map.version}
                      </span>
                    )}
                  </div>

                  {/* 標題 */}
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {map.title}
                  </h2>

                  {/* 簡介 */}
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, flex: 1 }}>{map.excerpt}</p>

                  {/* 下載次數 + 大小 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Download size={13} /> {map.downloads.toLocaleString()} {c.downloads}
                    </span>
                    {map.file_size && <span>{formatBytes(map.file_size)}</span>}
                  </div>

                  {/* 下載按鈕（stopPropagation 避免觸發卡片導覽） */}
                  <a
                    href={`/api/download/${map.id}`}
                    style={{
                      padding: '9px 0', background: '#22c55e', color: 'white',
                      borderRadius: '7px', textDecoration: 'none', textAlign: 'center',
                      fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMaps((prev) => prev.map((m) => m.id === map.id ? { ...m, downloads: m.downloads + 1 } : m));
                    }}
                  >
                    <Download size={15} /> {t.downloadMap}
                  </a>
                </div>
              </div>
          ))}
        </div>
      )}
    </div>
  );
}

function tagBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '3px 12px', borderRadius: '9999px',
    border: `1px solid ${active ? 'var(--accent-blue)' : 'rgba(59,130,246,0.25)'}`,
    background: active ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.07)',
    color: active ? 'var(--accent-blue-light)' : 'var(--text-secondary)',
    fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s',
  };
}
