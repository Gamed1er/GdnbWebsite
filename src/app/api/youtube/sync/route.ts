import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { syncYoutubeVideos } from '@/lib/youtubeSync';

export async function POST() {
  const session = await auth();
  const u = session?.user as unknown as Record<string, unknown> | undefined;
  if (u?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await syncYoutubeVideos();
  if ('error' in result) return NextResponse.json(result, { status: 500 });
  return NextResponse.json(result);
}
