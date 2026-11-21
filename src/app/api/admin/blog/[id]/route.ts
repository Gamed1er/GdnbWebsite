import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';
import { notifyNewPost } from '@/lib/discord';

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
  const excerpt = (body.description || body.excerpt) as string || null;
  db.prepare(`
    UPDATE blog_posts SET
      title = ?, content = ?, excerpt = ?, cover_image = ?,
      tags = ?, published = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    body.title, body.content, excerpt,
    body.cover_image || null, JSON.stringify(body.tags ?? []),
    body.published ? 1 : 0, Number(id)
  );

  if (body.published) {
    const current = db.prepare('SELECT discord_notified FROM blog_posts WHERE id = ?').get(Number(id)) as { discord_notified: number } | undefined;
    if (current && !current.discord_notified) {
      const notified = await notifyNewPost({
        type: 'blog', id: Number(id), title: body.title as string,
        description: excerpt, coverImage: (body.cover_image as string) || null,
      });
      if (notified) db.prepare('UPDATE blog_posts SET discord_notified = 1 WHERE id = ?').run(Number(id));
    }
  }

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
