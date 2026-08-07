import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';
import path from 'path';
import fs from 'fs';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json(null);

  const u = session.user as unknown as Record<string, unknown>;
  const role = u.role as string;
  const db = getDb();

  // 管理員也查 public_users（有 publicUserId 才能改頭貼暱稱）
  if (role === 'admin') {
    const publicUserId = u.publicUserId as number | undefined;
    if (publicUserId) {
      const adminUser = db
        .prepare('SELECT id, name, nickname, avatar_url, created_at FROM public_users WHERE id = ?')
        .get(publicUserId) as { id: number; name: string; nickname: string | null; avatar_url: string | null; created_at: string } | undefined;
      if (adminUser) {
        return NextResponse.json({
          role: 'admin',
          id: adminUser.id,
          name: adminUser.nickname ?? adminUser.name,
          displayName: adminUser.name,
          avatar: adminUser.avatar_url,
          createdAt: adminUser.created_at,
        });
      }
    }
    return NextResponse.json({ role: 'admin', name: session.user.name });
  }

  const publicUserId = u.publicUserId as number | undefined;
  if (!publicUserId) return NextResponse.json(null);
  const user = db
    .prepare('SELECT id, name, nickname, avatar_url, bio, created_at FROM public_users WHERE id = ?')
    .get(publicUserId) as {
      id: number; name: string; nickname: string | null;
      avatar_url: string | null; bio: string | null; created_at: string;
    } | undefined;

  if (!user) return NextResponse.json(null);

  // 未讀通知數
  const unread = (db
    .prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0')
    .get(publicUserId) as { count: number }).count;

  return NextResponse.json({
    role: 'user',
    id: user.id,
    name: user.nickname ?? user.name,
    displayName: user.name,
    avatar: user.avatar_url,
    bio: user.bio,
    unreadCount: unread,
    createdAt: user.created_at,
  });
}

// PATCH /api/me — 更新暱稱、頭貼 URL
export async function PATCH(req: Request) {
  const session = await auth();
  const u = session?.user as unknown as Record<string, unknown> | undefined;
  const publicUserId = u?.publicUserId as number | undefined;
  if (!publicUserId) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  const body = await req.json() as { nickname?: string; avatarUrl?: string | null };
  const db = getDb();
  const updates: string[] = [];
  const values: (string | null | number)[] = [];

  if ('nickname' in body) {
    const nick = body.nickname?.trim() ?? null;
    if (nick && nick.length > 30) return NextResponse.json({ error: '暱稱不得超過 30 字元' }, { status: 400 });
    updates.push('nickname = ?');
    values.push(nick);
  }
  if ('avatarUrl' in body) {
    // 若換新頭貼，刪除舊的自訂頭貼檔案
    if (body.avatarUrl !== null) {
      const current = db.prepare('SELECT avatar_url FROM public_users WHERE id = ?').get(publicUserId) as { avatar_url: string | null } | undefined;
      if (current?.avatar_url?.startsWith('/images/uploads/avatars/')) {
        const oldPath = path.join(process.cwd(), 'public', current.avatar_url);
        try { fs.unlinkSync(oldPath); } catch { /* 忽略 */ }
      }
    }
    updates.push('avatar_url = ?');
    values.push(body.avatarUrl ?? null);
  }

  if (updates.length === 0) return NextResponse.json({ error: '沒有可更新的欄位' }, { status: 400 });

  values.push(publicUserId);
  db.prepare(`UPDATE public_users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);

  return NextResponse.json({ ok: true });
}
