import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import fs from 'fs';
import path from 'path';

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

const EXT_BY_TYPE: Record<string, string> = {
  'image/gif': '.gif',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

// 擋掉內網位址，避免被拿來打本機或區網服務
function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local')) return true;
  if (h === '::1' || h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80')) return true;
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

// 從網址下載圖片（主要用於 GIF：瀏覽器「複製圖片」只會給靜態 PNG，需要從原網址抓動圖）
export async function POST(req: Request) {
  const session = await auth();
  const u = session?.user as Record<string, unknown> | undefined;
  if (u?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url } = await req.json() as { url?: string };
  let target: URL;
  try {
    target = new URL(url ?? '');
  } catch {
    return NextResponse.json({ error: '網址格式錯誤' }, { status: 400 });
  }
  if (!['http:', 'https:'].includes(target.protocol) || isPrivateHost(target.hostname)) {
    return NextResponse.json({ error: '不支援的網址' }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(target, { signal: AbortSignal.timeout(15000) });
  } catch {
    return NextResponse.json({ error: '下載失敗' }, { status: 502 });
  }
  if (!res.ok) return NextResponse.json({ error: `下載失敗（${res.status}）` }, { status: 502 });

  const contentType = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  const ext = EXT_BY_TYPE[contentType];
  if (!ext) return NextResponse.json({ error: '網址不是圖片' }, { status: 400 });
  if (Number(res.headers.get('content-length') ?? 0) > MAX_SIZE) {
    return NextResponse.json({ error: '檔案超過 20MB' }, { status: 413 });
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_SIZE) return NextResponse.json({ error: '檔案超過 20MB' }, { status: 413 });

  const saveDir = path.join(process.cwd(), 'public', 'images', 'uploads');
  if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  fs.writeFileSync(path.join(saveDir, filename), buffer);

  return NextResponse.json({ path: `/api/uploads/${filename}`, size: buffer.length });
}
