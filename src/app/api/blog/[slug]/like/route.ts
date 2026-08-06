import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

type Params = Promise<{ slug: string }>;

// action: 'like' | 'unlike'
export async function POST(req: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const { action } = await req.json() as { action: 'like' | 'unlike' };

  const db = getDb();
  if (action === 'like') {
    db.prepare(`UPDATE blog_posts SET likes = likes + 1 WHERE slug = ? AND published = 1`).run(slug);
  } else {
    db.prepare(`UPDATE blog_posts SET likes = MAX(0, likes - 1) WHERE slug = ? AND published = 1`).run(slug);
  }

  const post = db.prepare(`SELECT likes FROM blog_posts WHERE slug = ?`).get(slug) as { likes: number } | undefined;
  return NextResponse.json({ likes: post?.likes ?? 0 });
}
