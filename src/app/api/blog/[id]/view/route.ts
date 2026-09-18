import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

type Params = Promise<{ id: string }>;

export async function POST(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const db = getDb();
  db.prepare(`UPDATE blog_posts SET views = views + 1 WHERE id = ? AND published = 1`).run(Number(id));
  const post = db.prepare(`SELECT views FROM blog_posts WHERE id = ?`).get(Number(id)) as { views: number } | undefined;
  return NextResponse.json({ views: post?.views ?? 0 });
}
