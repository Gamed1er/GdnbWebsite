import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';
import fs from 'fs';
import path from 'path';

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const db = getDb();
  const item = db.prepare('SELECT * FROM minecraft_maps WHERE id = ?').get(Number(id)) as Record<string, unknown> | undefined;
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...item, tags: JSON.parse(item.tags as string) });
}

export async function PUT(req: Request, { params }: { params: Params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;
  const db = getDb();
  db.prepare(`
    UPDATE minecraft_maps SET
      title = ?, description = ?, cover_image = ?,
      file_path = ?, file_size = ?,
      datapack_path = ?, datapack_size = ?,
      resourcepack_path = ?, resourcepack_size = ?,
      version = ?, tags = ?, published = ?, sort_order = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    body.title, body.description,
    body.cover_image || null,
    body.file_path || null, body.file_size || null,
    body.datapack_path || null, body.datapack_size || null,
    body.resourcepack_path || null, body.resourcepack_size || null,
    body.version || null,
    JSON.stringify(body.tags ?? []),
    body.published ? 1 : 0,
    body.sort_order ?? 0,
    Number(id)
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const db = getDb();
  const item = db.prepare('SELECT file_path, datapack_path, resourcepack_path FROM minecraft_maps WHERE id = ?').get(Number(id)) as { file_path: string | null; datapack_path: string | null; resourcepack_path: string | null } | undefined;

  // 刪除實體檔案（若存在）
  if (item) {
    for (const p of [item.file_path, item.datapack_path, item.resourcepack_path]) {
      if (p) {
        const abs = path.join(process.cwd(), 'public', p);
        if (fs.existsSync(abs)) fs.unlinkSync(abs);
      }
    }
  }

  db.prepare('DELETE FROM minecraft_maps WHERE id = ?').run(Number(id));
  db.prepare('DELETE FROM download_logs WHERE map_id = ?').run(Number(id));
  db.prepare('DELETE FROM view_logs WHERE content_type = ? AND content_id = ?').run('minecraft', Number(id));
  return NextResponse.json({ ok: true });
}
