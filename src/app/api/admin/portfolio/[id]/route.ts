import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const db = getDb();
  const item = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(Number(id)) as Record<string, unknown> | undefined;
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({
    ...item,
    tags: JSON.parse(item.tags as string),
    extra_links: JSON.parse((item.extra_links as string) || '[]'),
  });
}

export async function PUT(req: Request, { params }: { params: Params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;
  const db = getDb();
  db.prepare(`
    UPDATE portfolio_items SET
      title = ?, description = ?, cover_image = ?, github_url = ?,
      extra_links = ?, tags = ?, published = ?, sort_order = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    body.title, body.description,
    body.cover_image || null, body.github_url || null,
    JSON.stringify(body.extra_links ?? []),
    JSON.stringify(body.tags ?? []),
    body.published ? 1 : 0,
    body.sort_order ?? 0,
    Number(id)
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM portfolio_items WHERE id = ?').run(Number(id));
  db.prepare('DELETE FROM view_logs WHERE content_type = ? AND content_id = ?').run('portfolio', Number(id));
  return NextResponse.json({ ok: true });
}
