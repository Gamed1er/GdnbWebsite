import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

const CHANNEL_ID_KEY = 'youtube_channel_id';
const YT_API_BASE = 'https://www.googleapis.com/youtube/v3';

export async function POST() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: '未設定 YOUTUBE_API_KEY 環境變數' }, { status: 500 });
  }

  const db = getDb();

  // 從設定取得 channel ID
  const setting = db.prepare(`SELECT value FROM site_settings WHERE key = ?`).get(CHANNEL_ID_KEY) as { value: string } | undefined;
  const channelId = setting?.value;
  if (!channelId) {
    return NextResponse.json({ error: '請在 site_settings 設定 youtube_channel_id' }, { status: 400 });
  }

  // 取得頻道最新影片（最多 50 支）
  const searchUrl = `${YT_API_BASE}/search?key=${apiKey}&channelId=${channelId}&part=snippet&order=date&maxResults=50&type=video`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    return NextResponse.json({ error: '呼叫 YouTube API 失敗', detail: await searchRes.text() }, { status: 500 });
  }
  const searchData = await searchRes.json() as { items: Array<{ id: { videoId: string }; snippet: { title: string; description: string; thumbnails: { medium: { url: string } }; publishedAt: string } }> };

  const videoIds = searchData.items.map((i) => i.id.videoId).join(',');
  if (!videoIds) return NextResponse.json({ synced: 0 });

  // 取得詳細資料（觀看數、時長）
  const detailUrl = `${YT_API_BASE}/videos?key=${apiKey}&id=${videoIds}&part=statistics,contentDetails`;
  const detailRes = await fetch(detailUrl);
  const detailData = await detailRes.json() as { items: Array<{ id: string; statistics: { viewCount: string }; contentDetails: { duration: string } }> };

  const detailMap = new Map(detailData.items.map((v) => [v.id, v]));

  const upsert = db.prepare(`
    INSERT INTO youtube_videos (id, title, description, thumbnail_url, published_at, duration, view_count, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      thumbnail_url = excluded.thumbnail_url,
      view_count = excluded.view_count,
      synced_at = CURRENT_TIMESTAMP
  `);

  let synced = 0;
  for (const item of searchData.items) {
    const id = item.id.videoId;
    const detail = detailMap.get(id);
    upsert.run(
      id,
      item.snippet.title,
      item.snippet.description,
      item.snippet.thumbnails.medium.url,
      item.snippet.publishedAt,
      detail?.contentDetails.duration ?? '',
      parseInt(detail?.statistics.viewCount ?? '0')
    );
    synced++;
  }

  // 更新最後同步時間
  db.prepare(`UPDATE site_settings SET value = CURRENT_TIMESTAMP WHERE key = 'youtube_last_sync'`).run();

  return NextResponse.json({ synced, message: `成功同步 ${synced} 支影片` });
}
