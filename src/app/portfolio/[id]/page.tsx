import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Metadata } from 'next';
import GithubIcon from '@/components/icons/GithubIcon';
import BlogInteractions from '@/components/BlogInteractions';

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

async function getItem(id: string): Promise<PortfolioItem | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/portfolio/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) return { title: '找不到作品' };
  const desc = item.description.replace(/[#*`\[\]]/g, '').slice(0, 160);
  return {
    title: item.title,
    description: desc,
    openGraph: {
      title: item.title,
      description: desc,
      images: [{ url: item.cover_image ?? '/images/og_tags.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: item.title,
      images: [item.cover_image ?? '/images/og_tags.png'],
    },
  };
}

export default async function PortfolioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <Link href="/portfolio" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '2rem' }}>
        <ArrowLeft size={15} /> 返回作品集
      </Link>

      {/* 封面圖 */}
      {item.cover_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.cover_image} alt={item.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '10px', marginBottom: '2rem' }} />
      )}

      <div style={{ marginBottom: '2rem' }}>
        {/* 標籤 */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {item.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
        </div>

        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.5rem 0 1rem' }}>
          {item.title}
        </h1>

        {/* 日期 + 觀看/喜歡 + 連結 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {item.github_url && (
              <a href={item.github_url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
                <GithubIcon size={16} /> GitHub
              </a>
            )}
            {item.extra_links?.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
                <ExternalLink size={16} /> {link.label}
              </a>
            ))}
          </div>
          {/* 用 BlogInteractions 但指向 portfolio API */}
          <BlogInteractions
            slug={String(item.id)}
            initialViews={item.views}
            initialLikes={item.likes}
            viewUrl={`/api/portfolio/${item.id}/view`}
            likeUrl={`/api/portfolio/${item.id}/like`}
            storageKey={`liked_portfolio_${item.id}`}
          />
        </div>
      </div>

      {/* Markdown 內容 */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '2rem' }}>
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.description}</ReactMarkdown>
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
        .markdown-body code { background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); border-radius: 4px; padding: 1px 6px; font-size: 0.88em; color: var(--accent-blue-light); font-family: monospace; }
        .markdown-body pre { background: #0a0f1a; border: 1px solid var(--border); border-radius: 8px; padding: 1rem; overflow-x: auto; margin: 1rem 0; }
        .markdown-body pre code { background: none; border: none; padding: 0; color: #a8d8f0; }
        .markdown-body a { color: var(--accent-blue-light); }
        .markdown-body blockquote { border-left: 3px solid var(--accent-blue); padding-left: 1rem; margin: 1rem 0; color: var(--text-muted); font-style: italic; }
        .markdown-body hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }
      `}</style>
    </div>
  );
}
