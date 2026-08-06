import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const uploadType = url.searchParams.get('type') ?? 'image'; // 'image' | 'map' | 'resourcepack'

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: '未提供檔案' }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  let saveDir: string;
  let publicPath: string;

  if (uploadType === 'map' || uploadType === 'resourcepack') {
    saveDir = path.join(process.cwd(), 'public', 'maps');
    publicPath = '/maps';
  } else {
    saveDir = path.join(process.cwd(), 'public', 'images', 'uploads');
    publicPath = '/api/uploads';
  }

  if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });

  // 使用時間戳 + 隨機碼，避免特殊字元造成 404
  const ext = path.extname(file.name) || (uploadType === 'image' ? '.jpg' : '.zip');
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const filepath = path.join(saveDir, filename);

  fs.writeFileSync(filepath, buffer);

  return NextResponse.json({
    path: `${publicPath}/${filename}`,
    size: buffer.length,
    name: file.name,
  });
}
