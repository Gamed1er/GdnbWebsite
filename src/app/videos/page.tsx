'use client';

import { useEffect, useState } from 'react';
import { Play, Eye } from 'lucide-react';

interface YoutubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  published_at: string;
  duration: string;
  view_count: number;
}

// ISO 8601 duration 轉可讀格式，e.g. PT10M30S → 10:30
function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const h = parseInt(match[1] ?? '0');
  const m = parseInt(match[2] ?? '0');
  const s = parseInt(match[3] ?? '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/videos')
      .then((r) => r.json())
      .then((data) => { setVideos(data); setLoading(false); });
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>影片</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            我的 YouTube 頻道影片，自動同步更新
          </p>
        </div>
        <a
          href="https://www.youtube.com/@gdnb_v2.0"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 18px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          ▶ 前往頻道訂閱
        </a>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem 0' }}>載入中...</div>
      ) : videos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <Play size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>尚未同步任何影片</p>
          <p style={{ fontSize: '0.85rem' }}>
            請先設定 YouTube API Key，然後在管理員後台執行同步
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {videos.map((video) => (
            <a
              key={video.id}
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <div className="card" style={{ overflow: 'hidden' }}>
                {/* 縮圖 */}
                <div style={{ position: 'relative', aspectRatio: '16/9', background: '#0a0f1a' }}>
                  {video.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                  {/* 播放 overlay */}
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0)', transition: 'background 0.2s',
                  }}
                    className="video-overlay"
                  >
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} className="play-btn">
                      <Play size={20} fill="#000" color="#000" style={{ marginLeft: '3px' }} />
                    </div>
                  </div>
                  {/* 時長 */}
                  {video.duration && (
                    <span style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.8)', color: 'white', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                      {parseDuration(video.duration)}
                    </span>
                  )}
                </div>

                {/* 資訊 */}
                <div style={{ padding: '0.9rem 1rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {video.title}
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>{new Date(video.published_at).toLocaleDateString('zh-TW')}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={12} /> {video.view_count.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      <style>{`
        a:hover .video-overlay { background: rgba(0,0,0,0.3) !important; }
        a:hover .play-btn { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
