import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

type Params = Promise<{ id: string }>;

// ?type=map（預設）或 ?type=resourcepack
export async function GET(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const rawType = searchParams.get('type');
  const type = rawType === 'resourcepack' ? 'resourcepack' : rawType === 'datapack' ? 'datapack' : 'map';

  const db = getDb();
  const map = db
    .prepare(`SELECT * FROM minecraft_maps WHERE id = ? AND published = 1`)
    .get(Number(id)) as Record<string, unknown> | undefined;

  if (!map) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // 決定檔案路徑
  const filePath = type === 'resourcepack'
    ? (map.resourcepack_path as string | null)
    : type === 'datapack'
    ? (map.datapack_path as string | null)
    : (map.file_path as string | null);

  if (!filePath) {
    return NextResponse.json({ error: '找不到對應檔案' }, { status: 404 });
  }

  // 檔案在 public 資料夾下
  const absolutePath = path.join(process.cwd(), 'public', filePath);

  if (!fs.existsSync(absolutePath)) {
    return NextResponse.json({ error: '檔案不存在' }, { status: 404 });
  }

  // 計數（只對地圖本體計數，不對資源包重複計）
  if (type === 'map') {
    db.prepare(`UPDATE minecraft_maps SET downloads = downloads + 1 WHERE id = ?`).run(Number(id));

    // 記錄 log（IP hash 保護隱私）
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
    db.prepare(`INSERT INTO download_logs (map_id, ip_hash) VALUES (?, ?)`).run(Number(id), ipHash);
  }

  // 串流檔案
  const stat = fs.statSync(absolutePath);
  const fileName = path.basename(absolutePath);
  const fileBuffer = fs.readFileSync(absolutePath);

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Content-Length': String(stat.size),
    },
  });
}
