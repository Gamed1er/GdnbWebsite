import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

type Params = Promise<{ id: string }>;

export function GET(_req: Request, { params }: { params: Params }) {
  return params.then(({ id }) => {
    const db = getDb();
    const map = db
      .prepare(`SELECT * FROM minecraft_maps WHERE id = ? AND published = 1`)
      .get(Number(id)) as Record<string, unknown> | undefined;

    if (!map) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ ...map, tags: JSON.parse(map.tags as string) });
  });
}
