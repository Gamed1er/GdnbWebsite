import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';

type Params = Promise<{ id: string }>;

async function requireAdmin() {
  const session = await auth();
  const u = session?.user as unknown as Record<string, unknown> | undefined;
  return u?.role === 'admin';
}

// POST /api/admin/users/[id]/ban — 封禁用戶
// body: { reason: string, days: number | null }  days=null 表示永久
export async function POST(req: Request, { params }: { params: Params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: '無權限' }, { status: 403 });
  const { id } = await params;
  const body = await req.json() as { reason?: string; days?: number | null };

  const db = getDb();
  const user = db.prepare('SELECT id FROM public_users WHERE id = ?').get(Number(id));
  if (!user) return NextResponse.json({ error: '找不到用戶' }, { status: 404 });

  let banUntil: string | null = null;
  if (body.days != null && body.days > 0) {
    const until = new Date();
    until.setDate(until.getDate() + body.days);
    banUntil = until.toISOString().replace('T', ' ').slice(0, 19);
  }

  db.prepare(`
    UPDATE public_users
    SET is_banned = 1, ban_until = ?, ban_reason = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(banUntil, body.reason?.slice(0, 200) ?? null, Number(id));

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/users/[id]/ban — 解除封禁
export async function DELETE(_req: Request, { params }: { params: Params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: '無權限' }, { status: 403 });
  const { id } = await params;

  const db = getDb();
  db.prepare(`
    UPDATE public_users
    SET is_banned = 0, ban_until = NULL, ban_reason = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(Number(id));

  return NextResponse.json({ ok: true });
}
