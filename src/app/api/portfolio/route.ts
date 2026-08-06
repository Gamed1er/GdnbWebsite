import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export function GET() {
  const db = getDb();
  const items = db
    .prepare(
      `SELECT id, title, description, cover_image, github_url, extra_links,
              tags, views, likes, sort_order, created_at
       FROM portfolio_items
       WHERE published = 1
       ORDER BY sort_order ASC, created_at DESC`
    )
    .all() as Array<Record<string, unknown>>;

  const parsed = items.map((item) => ({
    ...item,
    tags: JSON.parse(item.tags as string),
    extra_links: JSON.parse((item.extra_links as string) || '[]'),
  }));

  return NextResponse.json(parsed);
}
