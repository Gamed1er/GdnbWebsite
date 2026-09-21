// 共用的 YouTube 影片同步邏輯 — 供手動同步 API 與每日排程共用
import getDb from '@/lib/db';

const YT_API_BASE = 'https://www.googleapis.com/youtube/v3';
const MAX_PAGES = 40; // 安全上限：40 頁 * 50 支 = 最多 2000 支影片

type YouTubeApiError = { error?: { message: string } };

type PlaylistItemsResponse = YouTubeApiError & {
  items?: { snippet: { resourceId: { videoId: string } } }[];
  nextPageToken?: string;
};

type VideoDetail = {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: { high?: { url: string }; medium?: { url: string } };
    publishedAt: string;
  };
  contentDetails: { duration: string };
  statistics: { viewCount: string };
  liveStreamingDetails?: object;
};

type VideosResponse = YouTubeApiError & { items?: VideoDetail[] };

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

function recordSyncStatus(db: ReturnType<typeof getDb>, status: 'success' | 'error', error?: string) {
  const upsert = db.prepare(`
    INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);
  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    upsert.run('youtube_last_sync_at', now);
    upsert.run('youtube_last_sync_status', status);
    upsert.run('youtube_last_sync_error', error ?? '');
  });
  tx();
}

export async function syncYoutubeVideos(): Promise<{ synced: number } | { error: string }> {
  const db = getDb();

  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) throw new Error('未設定 YOUTUBE_API_KEY');

    const channelIdRow = db.prepare("SELECT value FROM site_settings WHERE key = 'youtube_channel_id'").get() as { value: string } | undefined;
    const channelId = channelIdRow?.value;
    if (!channelId) throw new Error('請先在設定中填入 YouTube 頻道 ID');

    const channelRes = await fetch(`${YT_API_BASE}/channels?part=contentDetails&id=${channelId}&key=${apiKey}`);
    const channelData = await channelRes.json() as YouTubeApiError & {
      items?: { contentDetails: { relatedPlaylists: { uploads: string } } }[];
    };
    if (channelData.error) throw new Error(channelData.error.message);
    const uploadsId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) throw new Error('無法取得頻道上傳清單');

    // 翻頁抓出上傳清單裡「全部」的影片 ID
    const videoIds: string[] = [];
    let pageToken = '';
    for (let page = 0; page < MAX_PAGES; page++) {
      const url = `${YT_API_BASE}/playlistItems?part=snippet&maxResults=50&playlistId=${uploadsId}&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`;
      const res = await fetch(url);
      const data = await res.json() as PlaylistItemsResponse;
      if (data.error) throw new Error(data.error.message);
      for (const item of data.items ?? []) videoIds.push(item.snippet.resourceId.videoId);
      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
    }

    if (videoIds.length === 0) {
      recordSyncStatus(db, 'success');
      return { synced: 0 };
    }

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
    const insertChunk = db.transaction((items: VideoDetail[]) => {
      for (const v of items) {
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

    // videos.list 一次最多吃 50 個 id，分批查詳細資料
    let synced = 0;
    for (let i = 0; i < videoIds.length; i += 50) {
      const chunk = videoIds.slice(i, i + 50);
      const detailRes = await fetch(
        `${YT_API_BASE}/videos?part=snippet,contentDetails,statistics,liveStreamingDetails&id=${chunk.join(',')}&key=${apiKey}`
      );
      const detailData = await detailRes.json() as VideosResponse;
      if (detailData.error) throw new Error(detailData.error.message);
      insertChunk(detailData.items ?? []);
      synced += detailData.items?.length ?? 0;
    }

    recordSyncStatus(db, 'success');
    return { synced };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    recordSyncStatus(db, 'error', message);
    return { error: message };
  }
}
