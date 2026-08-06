import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

type Params = Promise<{ slug: string }>;

export function POST(_req: Request, { params }: { params: Params }) {
  return params.then(({ slug }) => {
    const db = getDb();
    db.prepare(`UPDATE blog_posts SET views = views + 1 WHERE slug = ? AND published = 1`).run(slug);
    const post = db.prepare(`SELECT views FROM blog_posts WHERE slug = ?`).get(slug) as { views: number } | undefined;
    return NextResponse.json({ views: post?.views ?? 0 });
  });
}
