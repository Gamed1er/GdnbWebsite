import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';
import fs from 'fs';
import path from 'path';

// 從文字中抽取所有 /api/uploads/ 或 /images/uploads/ 的檔名
function extractUploadFilenames(text: string | null): string[] {
  if (!text) return [];
  const matches = text.matchAll(/\/(?:api\/uploads|images\/uploads)\/([^\s"')\]>]+)/g);
  return Array.from(matches, m => m[1]);
}

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uploadsDir = path.join(process.cwd(), 'public', 'images', 'uploads');

  // 若目錄不存在，直接回傳
  if (!fs.existsSync(uploadsDir)) {
    return NextResponse.json({ deleted: 0, freedBytes: 0, files: [] });
  }

  // 1. 取得 uploads 資料夾中所有檔案
  const allFiles = fs.readdirSync(uploadsDir).filter(f =>
    fs.statSync(path.join(uploadsDir, f)).isFile()
  );

  // 2. 從 DB 收集所有被引用的檔名
  const db = getDb();
  const referencedFilenames = new Set<string>();

  const addRefs = (text: string | null) => {
    extractUploadFilenames(text).forEach(f => referencedFilenames.add(f));
  };

  // blog_posts
  const blogs = db.prepare('SELECT cover_image, content, excerpt FROM blog_posts').all() as Array<{ cover_image: string | null; content: string | null; excerpt: string | null }>;
  for (const b of blogs) {
    addRefs(b.cover_image);
    addRefs(b.content);
    addRefs(b.excerpt);
  }

  // portfolio_items
  const portfolios = db.prepare('SELECT cover_image, description FROM portfolio_items').all() as Array<{ cover_image: string | null; description: string | null }>;
  for (const p of portfolios) {
    addRefs(p.cover_image);
    addRefs(p.description);
  }

  // minecraft_maps
  const maps = db.prepare('SELECT cover_image, description FROM minecraft_maps').all() as Array<{ cover_image: string | null; description: string | null }>;
  for (const m of maps) {
    addRefs(m.cover_image);
    addRefs(m.description);
  }

  // 3. 找出孤立檔案（在資料夾裡但沒有被任何 DB 欄位引用）
  const orphans = allFiles.filter(f => !referencedFilenames.has(f));

  // 4. 刪除孤立檔案，計算釋放空間
  let freedBytes = 0;
  const deletedFiles: string[] = [];

  for (const filename of orphans) {
    const filePath = path.join(uploadsDir, filename);
    try {
      const stat = fs.statSync(filePath);
      freedBytes += stat.size;
      fs.unlinkSync(filePath);
      deletedFiles.push(filename);
    } catch {
      // 跳過無法刪除的檔案
    }
  }

  return NextResponse.json({
    deleted: deletedFiles.length,
    freedBytes,
    files: deletedFiles,
  });
}

// GET：只預覽，不實際刪除
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uploadsDir = path.join(process.cwd(), 'public', 'images', 'uploads');

  if (!fs.existsSync(uploadsDir)) {
    return NextResponse.json({ orphans: 0, totalBytes: 0, files: [] });
  }

  const allFiles = fs.readdirSync(uploadsDir).filter(f =>
    fs.statSync(path.join(uploadsDir, f)).isFile()
  );

  const db = getDb();
  const referencedFilenames = new Set<string>();

  const addRefs = (text: string | null) => {
    extractUploadFilenames(text).forEach(f => referencedFilenames.add(f));
  };

  const blogs = db.prepare('SELECT cover_image, content, excerpt FROM blog_posts').all() as Array<{ cover_image: string | null; content: string | null; excerpt: string | null }>;
  for (const b of blogs) { addRefs(b.cover_image); addRefs(b.content); addRefs(b.excerpt); }

  const portfolios = db.prepare('SELECT cover_image, description FROM portfolio_items').all() as Array<{ cover_image: string | null; description: string | null }>;
  for (const p of portfolios) { addRefs(p.cover_image); addRefs(p.description); }

  const maps = db.prepare('SELECT cover_image, description FROM minecraft_maps').all() as Array<{ cover_image: string | null; description: string | null }>;
  for (const m of maps) { addRefs(m.cover_image); addRefs(m.description); }

  const orphans = allFiles.filter(f => !referencedFilenames.has(f));
  const totalBytes = orphans.reduce((sum, f) => {
    try { return sum + fs.statSync(path.join(uploadsDir, f)).size; } catch { return sum; }
  }, 0);

  return NextResponse.json({ orphans: orphans.length, totalBytes, files: orphans });
}
