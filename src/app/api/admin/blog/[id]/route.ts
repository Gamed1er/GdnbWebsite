import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const db = getDb();
  const post = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(Number(id)) as Record<string, unknown> | undefined;
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...post, tags: JSON.parse(post.tags as string), description: post.excerpt });
}

export async function PUT(req: Request, { params }: { params: Params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;
  const db = getDb();
  db.prepare(`
    UPDATE blog_posts SET
      title = ?, content = ?, excerpt = ?, cover_image = ?,
      tags = ?, published = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    body.title, body.content, (body.description || body.excerpt) || null,
    body.cover_image || null, JSON.stringify(body.tags ?? []),
    body.published ? 1 : 0, Number(id)
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM blog_posts WHERE id = ?').run(Number(id));
  db.prepare('DELETE FROM view_logs WHERE content_type = ? AND content_id = ?').run('blog', Number(id));
  return NextResponse.json({ ok: true });
}
