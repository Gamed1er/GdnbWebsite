import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';

interface DbNotification {
  id: number;
  type: string;
  is_read: number;
  created_at: string;
  from_user_name: string | null;
  from_user_nickname: string | null;
  comment_id: number | null;
  comment_post_type: string | null;
  comment_post_id: number | null;
}

// GET /api/me/notifications — 最近 20 則通知
export async function GET() {
  const session = await auth();
  const u = session?.user as unknown as Record<string, unknown> | undefined;
  const publicUserId = u?.publicUserId as number | undefined;
  if (!publicUserId) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  const db = getDb();
  const rows = db.prepare(`
    SELECT
      n.id, n.type, n.is_read, n.created_at,
      fu.name as from_user_name, fu.nickname as from_user_nickname,
      c.id as comment_id, c.post_type as comment_post_type, c.post_id as comment_post_id
    FROM notifications n
    LEFT JOIN public_users fu ON n.from_user_id = fu.id
    LEFT JOIN comments c ON n.comment_id = c.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT 20
  `).all(publicUserId) as DbNotification[];

  const result = rows.map(r => ({
    id: r.id,
    type: r.type,
    isRead: !!r.is_read,
    createdAt: r.created_at,
    fromUser: r.from_user_nickname ?? r.from_user_name ?? '某人',
    comment: r.comment_id ? {
      id: r.comment_id,
      postType: r.comment_post_type,
      postId: r.comment_post_id,
    } : null,
  }));

  return NextResponse.json(result);
}

// POST /api/me/notifications — 標記全部已讀
export async function POST() {
  const session = await auth();
  const u = session?.user as unknown as Record<string, unknown> | undefined;
  const publicUserId = u?.publicUserId as number | undefined;
  if (!publicUserId) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  const db = getDb();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(publicUserId);
  return NextResponse.json({ ok: true });
}
