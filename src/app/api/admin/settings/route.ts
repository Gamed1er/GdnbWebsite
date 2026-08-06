import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM site_settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as Record<string, string>;
  const db = getDb();
  const upsert = db.prepare(`
    INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);
  const insertMany = db.transaction((entries: [string, string][]) => {
    for (const [k, v] of entries) upsert.run(k, v);
  });
  insertMany(Object.entries(body));
  return NextResponse.json({ ok: true });
}
