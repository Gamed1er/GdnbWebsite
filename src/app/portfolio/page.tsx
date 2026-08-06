'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Eye, Heart, ExternalLink } from 'lucide-react';
import GithubIcon from '@/components/icons/GithubIcon';

interface ExtraLink { label: string; url: string }

interface PortfolioItem {
  id: number;
  title: string;
  description: string;
  cover_image: string | null;
  github_url: string | null;
  extra_links: ExtraLink[];
  tags: string[];
  views: number;
  likes: number;
  created_at: string;
}

export default function PortfolioPage() {
  const router = useRouter();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/portfolio')
      .then((r) => r.json())
      .then((data) => { setItems(data); setLoading(false); });
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => item.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => items.filter((item) => {
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase());
    const matchTag = !activeTag || item.tags.includes(activeTag);
    return matchSearch && matchTag;
  }), [items, search, activeTag]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>作品集</h1>
        <p style={{ color: 'var(--text-secondary)' }}>遊戲開發、資工專案，以及各種我做過的東西</p>
      </div>

      {/* 搜尋 + 標籤 */}
      <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="搜尋作品..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent-blue)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
        {allTags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>標籤：</span>
            <button onClick={() => setActiveTag(null)} style={tagBtnStyle(activeTag === null)}>全部</button>
            {allTags.map((tag) => (
              <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} style={tagBtnStyle(activeTag === tag)}>{tag}</button>
            ))}
          </div>
        )}
      </div>

      {!loading && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>共 {filtered.length} 個作品</p>}

      {loading ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem 0' }}>載入中...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem 0' }}>找不到符合的作品</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{ display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer' }}
              onClick={() => router.push(`/portfolio/${item.id}`)}
            >
              {/* 封面圖 */}
              {item.cover_image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.cover_image} alt={item.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '8px 8px 0 0' }} />
              )}

              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                {/* 標籤 */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {item.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
                </div>

                {/* 標題 */}
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  {item.title}
                </h2>

                {/* 簡介 */}
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, flex: 1 }}>
                  {item.description.replace(/[#*`\[\]]/g, '').slice(0, 100)}...
                </p>

                {/* 底部：觀看/喜歡 + 外部連結 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Eye size={13} /> {item.views}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Heart size={13} /> {item.likes}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {item.github_url && (
                      <a href={item.github_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                        style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.82rem', textDecoration: 'none' }}>
                        <GithubIcon size={13} />
                      </a>
                    )}
                    {item.extra_links?.map((link) => (
                      <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                        style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.82rem', textDecoration: 'none' }}>
                        <ExternalLink size={13} />
                      </a>
                    ))}
                  </div>
                </div>
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
