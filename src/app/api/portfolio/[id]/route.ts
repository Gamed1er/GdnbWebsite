import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

type Params = Promise<{ id: string }>;

export function GET(_req: Request, { params }: { params: Params }) {
  return params.then(({ id }) => {
    const db = getDb();
    const item = db
      .prepare(`SELECT * FROM portfolio_items WHERE id = ? AND published = 1`)
      .get(Number(id)) as Record<string, unknown> | undefined;

    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      ...item,
      tags: JSON.parse(item.tags as string),
      extra_links: JSON.parse((item.extra_links as string) || '[]'),
    });
  });
}
