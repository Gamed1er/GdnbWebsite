import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

type Params = Promise<{ slug: string }>;

export function GET(_req: Request, { params }: { params: Params }) {
  return params.then(({ slug }) => {
    const db = getDb();
    const post = db
      .prepare(`SELECT * FROM blog_posts WHERE slug = ? AND published = 1`)
      .get(slug) as Record<string, unknown> | undefined;

    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ ...post, tags: JSON.parse(post.tags as string) });
  });
}
