import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';

// GET /api/admin/users?page=1&search=
export async function GET(req: Request) {
  const session = await auth();
  const u = session?.user as unknown as Record<string, unknown> | undefined;
  if (u?.role !== 'admin') return NextResponse.json({ error: '無權限' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = 30;
  const offset = (page - 1) * limit;

  const db = getDb();
  const params: (string | number)[] = [];
  let where = 'WHERE 1=1';
  if (search) {
    where += ' AND (u.name LIKE ? OR u.nickname LIKE ? OR u.email LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const rows = db.prepare(`
    SELECT
      u.id, u.name, u.nickname, u.email, u.avatar_url,
      u.is_banned, u.ban_until, u.ban_reason, u.created_at,
      COUNT(c.id) as comment_count
    FROM public_users u
    LEFT JOIN comments c ON c.user_id = u.id AND c.is_deleted = 0
    ${where}
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as Array<{
    id: number; name: string; nickname: string | null; email: string;
    avatar_url: string | null; is_banned: number; ban_until: string | null;
    ban_reason: string | null; created_at: string; comment_count: number;
  }>;

  const total = (db.prepare(`
    SELECT COUNT(*) as count FROM public_users u ${where}
  `).get(...params) as { count: number }).count;

  return NextResponse.json({
    users: rows.map(r => ({
      id: r.id,
      name: r.nickname ?? r.name,
      displayName: r.name,
      email: r.email,
      avatar: r.avatar_url,
      isBanned: !!r.is_banned,
      banUntil: r.ban_until,
      banReason: r.ban_reason,
      createdAt: r.created_at,
      commentCount: r.comment_count,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
