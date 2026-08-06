import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() || `post-${Date.now()}`;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    title: string; content: string; excerpt?: string; cover_image?: string;
    tags?: string[]; published?: boolean; slug?: string;
  };

  const db = getDb();
  const slug = body.slug || slugify(body.title);

  // 確保 slug 唯一
  let finalSlug = slug;
  let counter = 1;
  while (db.prepare('SELECT id FROM blog_posts WHERE slug = ?').get(finalSlug)) {
    finalSlug = `${slug}-${counter++}`;
  }

  const result = db.prepare(`
    INSERT INTO blog_posts (slug, title, content, excerpt, cover_image, tags, published)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    finalSlug,
    body.title,
    body.content,
    (body as Record<string, unknown>).description as string || body.excerpt || null,
    body.cover_image || null,
    JSON.stringify(body.tags ?? []),
    body.published ? 1 : 0
  );

  return NextResponse.json({ id: result.lastInsertRowid, slug: finalSlug });
}
