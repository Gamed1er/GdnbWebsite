import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';

type Params = Promise<{ type: string; id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, id } = await params;
  const db = getDb();

  // 最近 30 天每日觀看數
  const views = db.prepare(`
    SELECT viewed_at as date, COUNT(*) as count
    FROM view_logs
    WHERE content_type = ? AND content_id = ?
      AND viewed_at >= date('now', '-30 days')
    GROUP BY viewed_at
    ORDER BY viewed_at ASC
  `).all(type, Number(id)) as { date: string; count: number }[];

  // 總計（從主表取，因為 view_logs 只有新資料）
  let total = { views: 0, likes: 0, downloads: 0 };
  if (type === 'blog') {
    const r = db.prepare('SELECT views, likes FROM blog_posts WHERE id = ?').get(Number(id)) as { views: number; likes: number } | undefined;
    total = { views: r?.views ?? 0, likes: r?.likes ?? 0, downloads: 0 };
  } else if (type === 'portfolio') {
    const r = db.prepare('SELECT views, likes FROM portfolio_items WHERE id = ?').get(Number(id)) as { views: number; likes: number } | undefined;
    total = { views: r?.views ?? 0, likes: r?.likes ?? 0, downloads: 0 };
  } else if (type === 'minecraft') {
    const r = db.prepare('SELECT views, downloads FROM minecraft_maps WHERE id = ?').get(Number(id)) as { views: number; downloads: number } | undefined;
    // 最近 30 天下載數
    const downloads = db.prepare(`
      SELECT downloaded_at as date, COUNT(*) as count
      FROM download_logs
      WHERE map_id = ? AND downloaded_at >= date('now', '-30 days')
      GROUP BY downloaded_at ORDER BY downloaded_at ASC
    `).all(Number(id)) as { date: string; count: number }[];
    total = { views: r?.views ?? 0, likes: 0, downloads: r?.downloads ?? 0 };
    return NextResponse.json({ views, downloads, total });
  }

  return NextResponse.json({ views, total });
}
