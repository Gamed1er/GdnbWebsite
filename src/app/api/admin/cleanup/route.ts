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

async function requireAdmin(): Promise<boolean> {
  const session = await auth();
  const u = session?.user as unknown as Record<string, unknown> | undefined;
  return u?.role === 'admin';
}

// 收集 DB 中所有被引用的圖片檔名
function getReferencedImageFilenames(db: ReturnType<typeof getDb>): Set<string> {
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

  // 頭貼：從 public_users 收集 /api/uploads/avatars/ 的檔名
  const users = db.prepare("SELECT avatar_url FROM public_users WHERE avatar_url IS NOT NULL AND avatar_url NOT LIKE 'https://%'").all() as Array<{ avatar_url: string }>;
  for (const u of users) {
    const match = u.avatar_url.match(/\/api\/uploads\/avatars\/([^\s"')\]>]+)/);
    if (match) referencedFilenames.add(`avatars/${match[1]}`);
  }

  return referencedFilenames;
}

// 收集 DB 中所有被引用的地圖檔案名稱（只取 basename，不管路徑前綴格式）
function getReferencedMapFiles(db: ReturnType<typeof getDb>): Set<string> {
  const referenced = new Set<string>();
  const maps = db.prepare('SELECT file_path, datapack_path, resourcepack_path FROM minecraft_maps').all() as Array<{
    file_path: string | null;
    datapack_path: string | null;
    resourcepack_path: string | null;
  }>;
  for (const m of maps) {
    if (m.file_path) referenced.add(path.basename(m.file_path));
    if (m.datapack_path) referenced.add(path.basename(m.datapack_path));
    if (m.resourcepack_path) referenced.add(path.basename(m.resourcepack_path));
  }
  return referenced;
}

interface CleanupResult {
  deletedComments: number;
  deletedImages: number;
  deletedMapFiles: number;
  freedBytes: number;
}

interface PreviewResult {
  softDeletedComments: number;
  orphanImages: number;
  orphanMapFiles: number;
  totalBytes: number;
}

// GET：預覽，不實際刪除
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();

  // 1. 軟刪除留言數
  const softDeletedComments = (db.prepare('SELECT COUNT(*) as c FROM comments WHERE is_deleted = 1').get() as { c: number }).c;

  // 2. 孤立圖片
  const uploadsDir = path.join(process.cwd(), 'public', 'images', 'uploads');
  let orphanImages = 0;
  let totalBytes = 0;

  if (fs.existsSync(uploadsDir)) {
    const referencedImages = getReferencedImageFilenames(db);
    const allImageFiles = getAllFiles(uploadsDir, uploadsDir);
    const orphans = allImageFiles.filter(f => !referencedImages.has(f));
    orphanImages = orphans.length;
    totalBytes += orphans.reduce((sum, f) => {
      try { return sum + fs.statSync(path.join(uploadsDir, f)).size; } catch { return sum; }
    }, 0);
  }

  // 3. 孤立地圖 ZIP 檔案
  const mapsDir = path.join(process.cwd(), 'public', 'maps');
  let orphanMapFiles = 0;

  if (fs.existsSync(mapsDir)) {
    const referencedMaps = getReferencedMapFiles(db);
    const allMapFiles = fs.readdirSync(mapsDir).filter(f => fs.statSync(path.join(mapsDir, f)).isFile());
    const orphanFiles = allMapFiles.filter(f => !referencedMaps.has(f));
    orphanMapFiles = orphanFiles.length;
    totalBytes += orphanFiles.reduce((sum, f) => {
      try { return sum + fs.statSync(path.join(mapsDir, f)).size; } catch { return sum; }
    }, 0);
  }

  return NextResponse.json({ softDeletedComments, orphanImages, orphanMapFiles, totalBytes } satisfies PreviewResult);
}

// POST：實際執行清除
export async function POST() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  let freedBytes = 0;

  // 1. 硬刪除軟刪除的留言
  const deletedComments = (db.prepare('DELETE FROM comments WHERE is_deleted = 1').run()).changes;

  // 2. 刪除孤立圖片
  let deletedImages = 0;
  const uploadsDir = path.join(process.cwd(), 'public', 'images', 'uploads');

  if (fs.existsSync(uploadsDir)) {
    const referencedImages = getReferencedImageFilenames(db);
    const allImageFiles = getAllFiles(uploadsDir, uploadsDir);
    const orphans = allImageFiles.filter(f => !referencedImages.has(f));

    for (const relPath of orphans) {
      const filePath = path.join(uploadsDir, relPath);
      try {
        freedBytes += fs.statSync(filePath).size;
        fs.unlinkSync(filePath);
        deletedImages++;
      } catch { /* 跳過 */ }
    }
  }

  // 3. 刪除孤立地圖 ZIP
  let deletedMapFiles = 0;
  const mapsDir = path.join(process.cwd(), 'public', 'maps');

  if (fs.existsSync(mapsDir)) {
    const referencedMaps = getReferencedMapFiles(db);
    const allMapFiles = fs.readdirSync(mapsDir).filter(f => fs.statSync(path.join(mapsDir, f)).isFile());
    const orphans = allMapFiles.filter(f => !referencedMaps.has(f));

    for (const filename of orphans) {
      const filePath = path.join(mapsDir, filename);
      try {
        freedBytes += fs.statSync(filePath).size;
        fs.unlinkSync(filePath);
        deletedMapFiles++;
      } catch { /* 跳過 */ }
    }
  }

  return NextResponse.json({ deletedComments, deletedImages, deletedMapFiles, freedBytes } satisfies CleanupResult);
}

// 遞迴取得目錄下所有檔案（回傳相對路徑）
function getAllFiles(baseDir: string, currentDir: string): string[] {
  const result: string[] = [];
  for (const entry of fs.readdirSync(currentDir)) {
    const full = path.join(currentDir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      result.push(...getAllFiles(baseDir, full));
    } else {
      result.push(path.relative(baseDir, full));
    }
  }
  return result;
}
