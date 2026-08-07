import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json(null);

  const u = session.user as unknown as Record<string, unknown>;
  const role = u.role as string;

  // 管理員不需要查 public_users
  if (role === 'admin') {
    return NextResponse.json({ role: 'admin', name: session.user.name });
  }

  const publicUserId = u.publicUserId as number | undefined;
  if (!publicUserId) return NextResponse.json(null);

  const db = getDb();
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
