import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';
import path from 'path';
import fs from 'fs';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// POST /api/me/avatar — 上傳自訂頭貼
export async function POST(req: Request) {
  const session = await auth();
  const u = session?.user as unknown as Record<string, unknown> | undefined;
  const publicUserId = u?.publicUserId as number | undefined;
  if (!publicUserId) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: '請選擇檔案' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: '僅支援 JPG、PNG、WebP、GIF' }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: '檔案不得超過 5MB' }, { status: 400 });

  // 決定副檔名
  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : file.type === 'image/gif' ? 'gif' : 'webp';
  const filename = `${publicUserId}.${ext}`;
  const avatarsDir = path.join(process.cwd(), 'public', 'images', 'uploads', 'avatars');

  // 刪除舊的同用戶頭貼（不同副檔名）
  try {
    const files = fs.readdirSync(avatarsDir);
    for (const f of files) {
      if (f.startsWith(`${publicUserId}.`) && f !== filename) {
        fs.unlinkSync(path.join(avatarsDir, f));
      }
    }
  } catch { /* 忽略 */ }

  // 確保目錄存在
  fs.mkdirSync(avatarsDir, { recursive: true });

  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(avatarsDir, filename), buf);

  const avatarUrl = `/api/uploads/avatars/${filename}`;

  const db = getDb();
  db.prepare('UPDATE public_users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(avatarUrl, publicUserId);

  return NextResponse.json({ avatarUrl });
}
