import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const blogRows = db.prepare('SELECT tags FROM blog_posts').all() as { tags: string }[];
  const portfolioRows = db.prepare('SELECT tags FROM portfolio_items').all() as { tags: string }[];
  const mcRows = db.prepare('SELECT tags FROM minecraft_maps').all() as { tags: string }[];

  const all = [...blogRows, ...portfolioRows, ...mcRows]
    .flatMap(r => { try { return JSON.parse(r.tags) as string[]; } catch { return []; } });

  const unique = [...new Set(all)].sort();
  return NextResponse.json(unique);
}
