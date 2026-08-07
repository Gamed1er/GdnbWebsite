import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';
import { invalidateKeywordCache } from '@/lib/commentFilter';

async function requireAdmin() {
  const session = await auth();
  const u = session?.user as unknown as Record<string, unknown> | undefined;
  return u?.role === 'admin';
}

// GET /api/admin/blacklist
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: '無權限' }, { status: 403 });
  const db = getDb();
  const rows = db.prepare('SELECT id, keyword, created_at FROM comment_blacklist ORDER BY created_at DESC').all() as Array<{ id: number; keyword: string; created_at: string }>;
  return NextResponse.json(rows);
}

// POST /api/admin/blacklist — 新增關鍵字
// body: { keyword: string }
export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: '無權限' }, { status: 403 });
  const body = await req.json() as { keyword?: string };
  const keyword = body.keyword?.trim();
  if (!keyword) return NextResponse.json({ error: '請輸入關鍵字' }, { status: 400 });

  const db = getDb();
  try {
    db.prepare('INSERT INTO comment_blacklist (keyword) VALUES (?)').run(keyword);
    invalidateKeywordCache();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: '關鍵字已存在' }, { status: 400 });
  }
}

// DELETE /api/admin/blacklist?id=1
export async function DELETE(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: '無權限' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

  const db = getDb();
  db.prepare('DELETE FROM comment_blacklist WHERE id = ?').run(id);
  invalidateKeywordCache();
  return NextResponse.json({ ok: true });
}
