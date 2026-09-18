// GET /api/admin/tools/usage — 小工具使用次數統計（後台儀表板用）
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';

async function requireAdmin() {
  const session = await auth();
  const u = session?.user as unknown as Record<string, unknown> | undefined;
  return u?.role === 'admin';
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: '無權限' }, { status: 403 });

  const db = getDb();
  const rows = db.prepare(
    `SELECT tool_slug, COUNT(*) as count FROM tool_usage_logs GROUP BY tool_slug`
  ).all() as Array<{ tool_slug: string; count: number }>;

  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const bySlug = Object.fromEntries(rows.map((r) => [r.tool_slug, r.count]));

  return NextResponse.json({ total, bySlug });
}
