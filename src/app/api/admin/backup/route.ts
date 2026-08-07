import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cwd = process.cwd();
  const date = new Date().toISOString().slice(0, 10);

  // 收集要打包的路徑（只包含存在的）
  const targets = [
    'database/gdnb.db',
    'public/images/uploads',
    'public/maps',
  ].filter(p => fs.existsSync(path.join(cwd, p)));

  if (targets.length === 0) {
    return NextResponse.json({ error: '找不到可備份的檔案' }, { status: 404 });
  }

  try {
    const tarBuffer = execSync(
      `tar czf - ${targets.join(' ')}`,
      { cwd, maxBuffer: 512 * 1024 * 1024 } // 512 MB 上限
    );

    return new NextResponse(tarBuffer, {
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="gdnb-backup-${date}.tar.gz"`,
        'Content-Length': String(tarBuffer.length),
      },
    });
  } catch (err) {
    console.error('Backup error:', err);
    return NextResponse.json({ error: '備份失敗' }, { status: 500 });
  }
}
