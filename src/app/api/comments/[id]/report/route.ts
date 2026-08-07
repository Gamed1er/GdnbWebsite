import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';

type Params = Promise<{ id: string }>;

// POST /api/comments/[id]/report
export async function POST(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const session = await auth();
  const u = session?.user as unknown as Record<string, unknown> | undefined;
  const publicUserId = u?.publicUserId as number | undefined;

  if (!publicUserId) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  const body = await req.json() as { reason?: string };
  const db = getDb();

  const comment = db.prepare('SELECT id FROM comments WHERE id = ? AND is_deleted = 0').get(Number(id));
  if (!comment) return NextResponse.json({ error: '找不到留言' }, { status: 404 });

  // 防止重複檢舉
  const existing = db.prepare(
    'SELECT id FROM comment_reports WHERE comment_id = ? AND reporter_id = ?'
  ).get(Number(id), publicUserId);
  if (existing) return NextResponse.json({ error: '你已經檢舉過這則留言' }, { status: 400 });

  db.prepare(
    'INSERT INTO comment_reports (comment_id, reporter_id, reason) VALUES (?, ?, ?)'
  ).run(Number(id), publicUserId, body.reason?.slice(0, 200) ?? null);

  return NextResponse.json({ ok: true });
}
