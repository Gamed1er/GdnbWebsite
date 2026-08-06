import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const db = getDb();

  const result = db.prepare(`
    INSERT INTO portfolio_items (title, description, cover_image, github_url, extra_links, tags, published, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.title, body.description,
    body.cover_image || null, body.github_url || null,
    JSON.stringify(body.extra_links ?? []),
    JSON.stringify(body.tags ?? []),
    body.published ? 1 : 0,
    body.sort_order ?? 0
  );

  return NextResponse.json({ id: result.lastInsertRowid });
}
