'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Eye, Heart } from 'lucide-react';

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  views: number;
  likes: number;
  created_at: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/blog')
      .then((r) => r.json())
      .then((data) => { setPosts(data); setLoading(false); });
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [posts]);

  const filtered = useMemo(() => posts.filter((p) => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchTag = !activeTag || p.tags.includes(activeTag);
    return matchSearch && matchTag;
  }), [posts, search, activeTag]);

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>部落格</h1>
        <p style={{ color: 'var(--text-secondary)' }}>教學、心得，以及各種想法</p>
      </div>

      {/* 搜尋 */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="搜尋文章..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent-blue)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        {/* 標籤 */}
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

      {loading ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem 0' }}>載入中...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem 0' }}>找不到符合的文章</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: '1.5rem' }}>
                {/* 標籤 */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                  {post.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
                </div>

                {/* 標題 */}
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                  {post.title}
                </h2>

                {/* 摘要 */}
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                  {post.excerpt}
                </p>

                {/* 底部：日期 + 觀看/喜歡 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <span>{new Date(post.created_at).toLocaleDateString('zh-TW')}</span>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={13} /> {post.views.toLocaleString()}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Heart size={13} /> {post.likes.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function tagBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '3px 12px',
    borderRadius: '9999px',
    border: `1px solid ${active ? 'var(--accent-blue)' : 'rgba(59,130,246,0.25)'}`,
    background: active ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.07)',
    color: active ? 'var(--accent-blue-light)' : 'var(--text-secondary)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.15s',
  };
}
