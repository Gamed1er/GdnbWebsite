// POST /api/tools/usage — 記錄小工具被使用一次（公開端點，不需登入）
import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

const KNOWN_TOOL_SLUGS = ['image-background-removal'];

export async function POST(req: Request) {
  let slug: unknown;
  try {
    const body = await req.json();
    slug = body?.slug;
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (typeof slug !== 'string' || !KNOWN_TOOL_SLUGS.includes(slug)) {
    return NextResponse.json({ error: 'Unknown tool' }, { status: 400 });
  }

  const db = getDb();
  db.prepare('INSERT INTO tool_usage_logs (tool_slug) VALUES (?)').run(slug);

  return NextResponse.json({ ok: true });
}
