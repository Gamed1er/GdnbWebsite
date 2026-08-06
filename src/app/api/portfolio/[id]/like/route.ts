import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

type Params = Promise<{ id: string }>;

export async function POST(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const { action } = await req.json() as { action: 'like' | 'unlike' };
  const db = getDb();
  if (action === 'like') {
    db.prepare(`UPDATE portfolio_items SET likes = likes + 1 WHERE id = ? AND published = 1`).run(Number(id));
  } else {
    db.prepare(`UPDATE portfolio_items SET likes = MAX(0, likes - 1) WHERE id = ? AND published = 1`).run(Number(id));
  }
  const item = db.prepare(`SELECT likes FROM portfolio_items WHERE id = ?`).get(Number(id)) as { likes: number } | undefined;
  return NextResponse.json({ likes: item?.likes ?? 0 });
}
