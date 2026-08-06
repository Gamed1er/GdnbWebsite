import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

type Params = Promise<{ id: string }>;

export function POST(_req: Request, { params }: { params: Params }) {
  return params.then(({ id }) => {
    const db = getDb();
    db.prepare(`UPDATE portfolio_items SET views = views + 1 WHERE id = ? AND published = 1`).run(Number(id));
    db.prepare(`INSERT INTO view_logs (content_type, content_id) VALUES ('portfolio', ?)`).run(Number(id));
    const item = db.prepare(`SELECT views FROM portfolio_items WHERE id = ?`).get(Number(id)) as { views: number } | undefined;
    return NextResponse.json({ views: item?.views ?? 0 });
  });
}
