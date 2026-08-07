import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Package } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CommentSection from '@/components/CommentSection';
import rehypeRaw from 'rehype-raw';
import type { Metadata } from 'next';

interface MinecraftMap {
  id: number;
  title: string;
  description: string;
  cover_image: string | null;
  file_path: string | null;
  file_size: number | null;
  datapack_path: string | null;
  datapack_size: number | null;
  resourcepack_path: string | null;
  resourcepack_size: number | null;
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

async function getMap(id: string): Promise<MinecraftMap | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/minecraft/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const map = await getMap(id);
  if (!map) return { title: '找不到地圖' };
  const desc = map.description.replace(/[#*`\[\]]/g, '').slice(0, 160);
  return {
    title: map.title,
    description: desc,
    openGraph: {
      title: map.title,
      description: desc,
      images: [{ url: map.cover_image ?? '/images/og_tags.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: map.title,
      images: [map.cover_image ?? '/images/og_tags.png'],
    },
  };
}

export default async function MinecraftMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const map = await getMap(id);
  if (!map) notFound();

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* 返回 */}
      <Link href="/minecraft" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '2rem' }}>
        <ArrowLeft size={15} /> 返回地圖列表
      </Link>

      {/* 封面圖 */}
      {map.cover_image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={map.cover_image} alt={map.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '10px', marginBottom: '2rem' }} />
      ) : (
        <div style={{ width: '100%', aspectRatio: '16/9', background: 'linear-gradient(135deg, #1a3a2a 0%, #0d1f17 100%)', borderRadius: '10px', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Package size={60} style={{ color: '#22c55e', opacity: 0.3 }} />
        </div>
      )}

      {/* 標題區 */}
      <div style={{ marginBottom: '2rem' }}>
        {/* 標籤 + 版本 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {map.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
          </div>
          {map.version && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '3px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
              Minecraft {map.version}
            </span>
          )}
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '0.5rem' }}>
          {map.title}
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          發布於 {new Date(map.created_at).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
          　·　<Download size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {map.downloads.toLocaleString()} 次下載
        </p>
      </div>

      {/* 下載按鈕區 */}
      <div
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px',
          padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem',
        }}
      >
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>📦 下載</h2>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* 地圖下載 */}
          {map.file_path && (
            <a
              href={`/api/download/${map.id}?type=map`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '11px 22px', background: '#22c55e', color: 'white',
                borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem',
              }}
            >
              <Download size={17} />
              下載地圖
              {map.file_size && <span style={{ opacity: 0.8, fontSize: '0.82rem' }}>（{formatBytes(map.file_size)}）</span>}
            </a>
          )}

          {/* 資料包下載（若有） */}
          {map.datapack_path && (
            <a
              href={`/api/download/${map.id}?type=datapack`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '11px 22px', background: '#f59e0b', color: 'white',
                borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem',
              }}
            >
              <Download size={17} />
              下載資料包
              {map.datapack_size && <span style={{ opacity: 0.8, fontSize: '0.82rem' }}>（{formatBytes(map.datapack_size)}）</span>}
            </a>
          )}

          {/* 資源包下載（若有） */}
          {map.resourcepack_path && (
            <a
              href={`/api/download/${map.id}?type=resourcepack`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '11px 22px', background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                border: '1px solid var(--border)', borderRadius: '8px', textDecoration: 'none',
                fontWeight: 600, fontSize: '0.95rem',
              }}
            >
              <Package size={17} />
              下載資源包
              {map.resourcepack_size && <span style={{ opacity: 0.7, fontSize: '0.82rem' }}>（{formatBytes(map.resourcepack_size)}）</span>}
            </a>
          )}
        </div>

        {map.resourcepack_path && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            💡 此地圖有附屬資源包，建議同時下載以獲得最佳遊玩體驗
          </p>
        )}
      </div>

      {/* Markdown 說明 */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '2rem' }}>
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{map.description}</ReactMarkdown>
        </div>
      </div>

      <style>{`
        .markdown-body { color: var(--text-primary); line-height: 1.8; }
        .markdown-body h1, .markdown-body h2, .markdown-body h3 { color: var(--text-primary); margin: 1.5rem 0 0.75rem; font-weight: 700; }
        .markdown-body h1 { font-size: 1.7rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
        .markdown-body h2 { font-size: 1.3rem; }
        .markdown-body h3 { font-size: 1.1rem; }
        .markdown-body p { margin: 0.75rem 0; color: var(--text-secondary); }
        .markdown-body ul, .markdown-body ol { padding-left: 1.5rem; color: var(--text-secondary); }
        .markdown-body li { margin: 0.3rem 0; }
        .markdown-body strong { color: var(--text-primary); }
        .markdown-body code { background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); border-radius: 4px; padding: 1px 6px; font-size: 0.88em; color: var(--accent-blue-light); }
        .markdown-body pre { background: #0a0f1a; border: 1px solid var(--border); border-radius: 8px; padding: 1rem; overflow-x: auto; margin: 1rem 0; }
        .markdown-body pre code { background: none; border: none; padding: 0; color: #a8d8f0; }
        .markdown-body hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }
        .markdown-body blockquote { border-left: 3px solid #22c55e; padding-left: 1rem; margin: 1rem 0; color: var(--text-muted); font-style: italic; }
      `}</style>

      <CommentSection postType="minecraft" postId={map.id} />
    </div>
  );
}
