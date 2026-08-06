// GET /api/admin/posts — 取得所有類型的貼文（合併列表，供 Dashboard 使用）
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();

  const blogs = db.prepare(`SELECT id, 'blog' as type, title, slug as ref, published, views, likes, 0 as downloads, tags, created_at FROM blog_posts ORDER BY created_at DESC`).all() as Record<string, unknown>[];

  const portfolios = db.prepare(`SELECT id, 'portfolio' as type, title, id as ref, published, views, likes, 0 as downloads, tags, created_at FROM portfolio_items ORDER BY created_at DESC`).all() as Record<string, unknown>[];

  const maps = db.prepare(`SELECT id, 'minecraft' as type, title, id as ref, published, views, 0 as likes, downloads, tags, created_at FROM minecraft_maps ORDER BY created_at DESC`).all() as Record<string, unknown>[];

  // 合併並依時間排序
  const all = [...blogs, ...portfolios, ...maps].sort((a, b) =>
    new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()
  );

  return NextResponse.json(all);
}
