import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export function GET() {
  const db = getDb();
  const maps = db
    .prepare(
      `SELECT id, title, description, cover_image, file_size, resourcepack_path,
              resourcepack_size, version, tags, downloads, created_at
       FROM minecraft_maps
       WHERE published = 1
       ORDER BY sort_order ASC, created_at DESC`
    )
    .all() as Array<Record<string, unknown>>;

  const parsed = maps.map((m) => ({
    ...m,
    tags: JSON.parse(m.tags as string),
    // 簡介：取前 120 字
    excerpt: (m.description as string).replace(/[#*`\[\]]/g, '').slice(0, 120) + '...',
  }));

  return NextResponse.json(parsed);
}
