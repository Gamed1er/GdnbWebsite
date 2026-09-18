import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

type Params = Promise<{ id: string }>;

// action: 'like' | 'unlike'
export async function POST(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const { action } = await req.json() as { action: 'like' | 'unlike' };

  const db = getDb();
  if (action === 'like') {
    db.prepare(`UPDATE blog_posts SET likes = likes + 1 WHERE id = ? AND published = 1`).run(Number(id));
  } else {
    db.prepare(`UPDATE blog_posts SET likes = MAX(0, likes - 1) WHERE id = ? AND published = 1`).run(Number(id));
  }

  const post = db.prepare(`SELECT likes FROM blog_posts WHERE id = ?`).get(Number(id)) as { likes: number } | undefined;
  return NextResponse.json({ likes: post?.likes ?? 0 });
}
