import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Metadata } from 'next';
import BlogInteractions from '@/components/BlogInteractions';

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  content: string;
  tags: string[];
  views: number;
  likes: number;
  created_at: string;
}

async function getPost(slug: string): Promise<BlogPost | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/blog/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: '找不到文章' };
  return { title: post.title };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* 返回 */}
      <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '2rem' }}>
        <ArrowLeft size={15} /> 返回部落格
      </Link>

      {/* 標頭 */}
      <div style={{ marginBottom: '2rem' }}>
        {/* 標籤 */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {post.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
        </div>

        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '1rem' }}>
          {post.title}
        </h1>

        {/* 日期 + 觀看/喜歡 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {new Date(post.created_at).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <BlogInteractions slug={post.slug} initialViews={post.views} initialLikes={post.likes} />
        </div>
      </div>

      {/* 文章內容 */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '2rem' }}>
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>
      </div>

      {/* 底部喜歡（再次呼籲） */}
      <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>如果這篇文章對你有幫助，歡迎按喜歡 ❤️</p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <BlogInteractions slug={post.slug} initialViews={post.views} initialLikes={post.likes} />
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
        .markdown-body code { background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); border-radius: 4px; padding: 1px 6px; font-size: 0.88em; color: var(--accent-blue-light); font-family: 'Fira Code', 'Courier New', monospace; }
        .markdown-body pre { background: #0a0f1a; border: 1px solid var(--border); border-radius: 8px; padding: 1rem 1.25rem; overflow-x: auto; margin: 1rem 0; }
        .markdown-body pre code { background: none; border: none; padding: 0; color: #a8d8f0; font-size: 0.9em; }
        .markdown-body a { color: var(--accent-blue-light); }
        .markdown-body blockquote { border-left: 3px solid var(--accent-blue); padding-left: 1rem; margin: 1rem 0; color: var(--text-muted); font-style: italic; }
        .markdown-body hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }
        .markdown-body table { border-collapse: collapse; width: 100%; }
        .markdown-body th, .markdown-body td { border: 1px solid var(--border); padding: 8px 12px; color: var(--text-secondary); }
        .markdown-body th { background: var(--bg-secondary); color: var(--text-primary); }
      `}</style>
    </div>
  );
}
