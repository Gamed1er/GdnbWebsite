import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';

type Params = Promise<{ id: string }>;

// DELETE /api/comments/[id]  — 使用者刪自己的、管理員刪任何
export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  const u = session.user as unknown as Record<string, unknown>;
  const role = u.role as string;
  const publicUserId = u.publicUserId as number | undefined;

  const db = getDb();
  const comment = db
    .prepare('SELECT id, user_id, is_deleted FROM comments WHERE id = ?')
    .get(Number(id)) as { id: number; user_id: number; is_deleted: number } | undefined;

  if (!comment) return NextResponse.json({ error: '找不到留言' }, { status: 404 });
  if (comment.is_deleted) return NextResponse.json({ error: '留言已刪除' }, { status: 400 });

  const isAdmin = role === 'admin';
  const isOwner = publicUserId === comment.user_id;
  if (!isAdmin && !isOwner) return NextResponse.json({ error: '無權刪除' }, { status: 403 });

  db.prepare(`
    UPDATE comments SET is_deleted = 1, deleted_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(isAdmin ? 'admin' : 'user', Number(id));

  return NextResponse.json({ ok: true });
}
