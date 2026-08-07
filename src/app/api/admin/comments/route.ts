import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';

function requireAdmin() {
  return auth().then(session => {
    const u = session?.user as unknown as Record<string, unknown> | undefined;
    return u?.role === 'admin';
  });
}

// GET /api/admin/comments?post_type=blog&reported=1&page=1
export async function GET(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: '無權限' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const postType = searchParams.get('post_type') ?? '';
  const reported = searchParams.get('reported') === '1';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = 30;
  const offset = (page - 1) * limit;

  const db = getDb();

  let where = reported
    ? `WHERE cr.id IS NOT NULL`
    : `WHERE 1=1`;
  const params: (string | number)[] = [];

  if (postType) {
    where += ` AND c.post_type = ?`;
    params.push(postType);
  }

  const rows = db.prepare(`
    SELECT
      c.id, c.post_type, c.post_id, c.content, c.is_deleted, c.deleted_by,
      c.parent_id, c.created_at,
      u.id as user_id, u.name as user_name, u.nickname as user_nickname,
      u.email as user_email, u.is_banned,
      COUNT(DISTINCT cr.id) as report_count
    FROM comments c
    JOIN public_users u ON c.user_id = u.id
    LEFT JOIN comment_reports cr ON cr.comment_id = c.id
    ${where}
    GROUP BY c.id
    ORDER BY ${reported ? 'report_count DESC,' : ''} c.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as Array<{
    id: number; post_type: string; post_id: number;
    content: string | null; is_deleted: number; deleted_by: string | null;
    parent_id: number | null; created_at: string;
    user_id: number; user_name: string; user_nickname: string | null;
    user_email: string; is_banned: number; report_count: number;
  }>;

  const total = (db.prepare(`
    SELECT COUNT(DISTINCT c.id) as count
    FROM comments c
    LEFT JOIN comment_reports cr ON cr.comment_id = c.id
    ${where}
  `).get(...params) as { count: number }).count;

  return NextResponse.json({
    comments: rows.map(r => ({
      id: r.id,
      postType: r.post_type,
      postId: r.post_id,
      content: r.content,
      isDeleted: !!r.is_deleted,
      deletedBy: r.deleted_by,
      parentId: r.parent_id,
      createdAt: r.created_at,
      reportCount: r.report_count,
      user: {
        id: r.user_id,
        name: r.user_nickname ?? r.user_name,
        email: r.user_email,
        isBanned: !!r.is_banned,
      },
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
