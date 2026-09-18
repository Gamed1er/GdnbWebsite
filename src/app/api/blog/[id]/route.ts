import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const db = getDb();
  const post = db
    .prepare(`SELECT * FROM blog_posts WHERE id = ? AND published = 1`)
    .get(Number(id)) as Record<string, unknown> | undefined;

  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ ...post, tags: JSON.parse(post.tags as string) });
}
