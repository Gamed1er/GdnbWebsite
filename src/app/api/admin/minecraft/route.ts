import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';
import { notifyNewPost } from '@/lib/discord';

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const db = getDb();

  const result = db.prepare(`
    INSERT INTO minecraft_maps (title, description, cover_image, file_path, file_size, datapack_path, datapack_size, resourcepack_path, resourcepack_size, version, tags, published, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.title, body.description,
    body.cover_image || null,
    body.file_path || null, body.file_size || null,
    body.datapack_path || null, body.datapack_size || null,
    body.resourcepack_path || null, body.resourcepack_size || null,
    body.version || null,
    JSON.stringify(body.tags ?? []),
    body.published ? 1 : 0,
    body.sort_order ?? 0
  );

  if (body.published) {
    const notified = await notifyNewPost({
      type: 'minecraft', id: Number(result.lastInsertRowid), title: body.title as string,
      description: body.description as string, coverImage: (body.cover_image as string) || null,
    });
    if (notified) db.prepare('UPDATE minecraft_maps SET discord_notified = 1 WHERE id = ?').run(result.lastInsertRowid);
  }

  return NextResponse.json({ id: result.lastInsertRowid });
}
