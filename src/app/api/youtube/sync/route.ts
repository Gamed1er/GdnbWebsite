import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getDb from '@/lib/db';

function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || '0') * 3600) + (parseInt(m[2] || '0') * 60) + parseInt(m[3] || '0');
}

function detectType(duration: string, hasLiveDetails: boolean): 'video' | 'short' | 'live' {
  if (hasLiveDetails) return 'live';
  const secs = parseDuration(duration);
  if (secs > 0 && secs <= 60) return 'short';
  return 'video';
}

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: '未設定 YOUTUBE_API_KEY' }, { status: 500 });

  const db = getDb();
  const channelIdRow = db.prepare("SELECT value FROM site_settings WHERE key = 'youtube_channel_id'").get() as { value: string } | undefined;
  const channelId = channelIdRow?.value;
  if (!channelId) return NextResponse.json({ error: '請先在設定中填入 YouTube 頻道 ID' }, { status: 400 });

  const channelRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
  );
  const channelData = await channelRes.json() as {
    items?: { contentDetails: { relatedPlaylists: { uploads: string } } }[];
  };
  const uploadsId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) return NextResponse.json({ error: '無法取得頻道上傳清單' }, { status: 500 });

  const listRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=50&key=${apiKey}`
  );
  const listData = await listRes.json() as {
    items?: { snippet: { resourceId: { videoId: string } } }[];
  };
  const videoIds = listData.items?.map(i => i.snippet.resourceId.videoId) ?? [];
  if (videoIds.length === 0) return NextResponse.json({ synced: 0 });

  const detailRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,liveStreamingDetails&id=${videoIds.join(',')}&key=${apiKey}`
  );
  const detailData = await detailRes.json() as {
    items?: {
      id: string;
      snippet: { title: string; description: string; thumbnails: { high?: { url: string }; medium?: { url: string } }; publishedAt: string };
      contentDetails: { duration: string };
      statistics: { viewCount: string };
      liveStreamingDetails?: object;
    }[];
  };

  const upsert = db.prepare(`
    INSERT INTO youtube_videos (id, title, description, thumbnail_url, published_at, duration, video_type, view_count, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      thumbnail_url = excluded.thumbnail_url,
      video_type = excluded.video_type,
      view_count = excluded.view_count,
      synced_at = excluded.synced_at
  `);

  const insertAll = db.transaction(() => {
    for (const v of detailData.items ?? []) {
      const videoType = detectType(v.contentDetails.duration, !!v.liveStreamingDetails);
      upsert.run(
        v.id,
        v.snippet.title,
        v.snippet.description,
        v.snippet.thumbnails.high?.url ?? v.snippet.thumbnails.medium?.url ?? '',
        v.snippet.publishedAt,
        v.contentDetails.duration,
        videoType,
        parseInt(v.statistics.viewCount) || 0
      );
    }
  });
  insertAll();

  db.prepare(`INSERT INTO site_settings (key, value, updated_at) VALUES ('youtube_last_sync', datetime('now'), CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`).run();

  return NextResponse.json({ synced: detailData.items?.length ?? 0 });
}
