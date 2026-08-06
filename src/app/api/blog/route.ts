import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export function GET() {
  const db = getDb();
  const posts = db
    .prepare(
      `SELECT id, slug, title, excerpt, content, cover_image, tags, views, likes, created_at
       FROM blog_posts
       WHERE published = 1
       ORDER BY created_at DESC`
    )
    .all() as Array<Record<string, unknown>>;

  const parsed = posts.map((p) => ({
    ...p,
    tags: JSON.parse(p.tags as string),
    // 自動取前 120 字作為 excerpt
    excerpt: p.excerpt || (p.content as string).replace(/[#*`\[\]]/g, '').slice(0, 120) + '...',
  }));

  return NextResponse.json(parsed);
}
