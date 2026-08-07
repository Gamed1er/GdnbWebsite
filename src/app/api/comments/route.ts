import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';
import { filterComment } from '@/lib/commentFilter';

interface DbComment {
  id: number;
  post_type: string;
  post_id: number;
  user_id: number;
  content: string;
  parent_id: number | null;
  is_deleted: number;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_nickname: string | null;
  author_avatar: string | null;
}

// GET /api/comments?post_type=blog&post_id=1
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const postType = searchParams.get('post_type');
  const postId = Number(searchParams.get('post_id'));

  if (!postType || !postId) {
    return NextResponse.json({ error: '缺少參數' }, { status: 400 });
  }

  const db = getDb();
  const rows = db.prepare(`
    SELECT c.*,
      u.name as author_name, u.nickname as author_nickname, u.avatar_url as author_avatar
    FROM comments c
    JOIN public_users u ON c.user_id = u.id
    WHERE c.post_type = ? AND c.post_id = ? AND c.parent_id IS NULL
    ORDER BY c.created_at ASC
  `).all(postType, postId) as DbComment[];

  // 取所有回覆
  const replies = db.prepare(`
    SELECT c.*,
      u.name as author_name, u.nickname as author_nickname, u.avatar_url as author_avatar
    FROM comments c
    JOIN public_users u ON c.user_id = u.id
    WHERE c.post_type = ? AND c.post_id = ? AND c.parent_id IS NOT NULL
    ORDER BY c.created_at ASC
  `).all(postType, postId) as DbComment[];

  const replyMap = new Map<number, DbComment[]>();
  for (const r of replies) {
    const pid = r.parent_id!;
    if (!replyMap.has(pid)) replyMap.set(pid, []);
    replyMap.get(pid)!.push(r);
  }

  const format = (c: DbComment) => ({
    id: c.id,
    content: c.is_deleted ? null : c.content,
    isDeleted: !!c.is_deleted,
    deletedBy: c.deleted_by,
    parentId: c.parent_id,
    userId: c.user_id,
    author: {
      name: c.author_nickname ?? c.author_name,
      avatar: c.author_avatar,
    },
    createdAt: c.created_at,
  });

  const result = rows.map(c => ({
    ...format(c),
    replies: (replyMap.get(c.id) ?? []).map(format),
  }));

  return NextResponse.json(result);
}

// POST /api/comments
export async function POST(req: Request) {
  const session = await auth();
  const u = session?.user as unknown as Record<string, unknown> | undefined;
  const publicUserId = u?.publicUserId as number | undefined;

  if (!publicUserId) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 });
  }

  // Rate limit
  const rl = checkRateLimit(publicUserId);
  if (!rl.allowed) {
    return NextResponse.json({ error: '留言太頻繁，請稍後再試（每分鐘最多 5 則）' }, { status: 429 });
  }

  const body = await req.json() as {
    post_type: string; post_id: number;
    content: string; parent_id?: number;
  };

  const { post_type, post_id, content, parent_id } = body;

  if (!post_type || !post_id || !content?.trim()) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
  }
  if (content.length > 1024) {
    return NextResponse.json({ error: '留言不得超過 1024 字元' }, { status: 400 });
  }

  // 黑名單過濾
  const filter = filterComment(content);
  if (filter.blocked) {
    return NextResponse.json({ error: '留言包含不允許的內容' }, { status: 400 });
  }

  const db = getDb();

  // 確認 parent 存在且是頂層留言（防止超過一層巢狀）
  if (parent_id) {
    const parent = db.prepare('SELECT id, parent_id FROM comments WHERE id = ? AND is_deleted = 0').get(parent_id) as { id: number; parent_id: number | null } | undefined;
    if (!parent) return NextResponse.json({ error: '找不到原留言' }, { status: 404 });
    if (parent.parent_id !== null) return NextResponse.json({ error: '不允許超過一層回覆' }, { status: 400 });
  }

  const result = db.prepare(`
    INSERT INTO comments (post_type, post_id, user_id, content, parent_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(post_type, post_id, publicUserId, content.trim(), parent_id ?? null);

  const commentId = result.lastInsertRowid as number;

  // 建立通知（回覆時通知原留言作者）
  if (parent_id) {
    const parentComment = db.prepare('SELECT user_id FROM comments WHERE id = ?').get(parent_id) as { user_id: number } | undefined;
    if (parentComment && parentComment.user_id !== publicUserId) {
      db.prepare(`
        INSERT INTO notifications (user_id, type, from_user_id, comment_id)
        VALUES (?, 'reply', ?, ?)
      `).run(parentComment.user_id, publicUserId, commentId);
    }
  }

  return NextResponse.json({ id: commentId, remaining: rl.remaining });
}
