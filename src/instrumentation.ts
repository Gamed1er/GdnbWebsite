// 每天 19:00 (Asia/Taipei) 自動同步 YouTube 影片
// register() 在每次 Next.js server 啟動時只跑一次，PM2 重啟/部署都會重新註冊排程
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const cron = (await import('node-cron')).default;
  const { syncYoutubeVideos } = await import('@/lib/youtubeSync');

  cron.schedule(
    '0 19 * * *',
    async () => {
      const result = await syncYoutubeVideos();
      if ('error' in result) {
        console.error('[youtube-sync/cron] 同步失敗:', result.error);
      } else {
        console.log(`[youtube-sync/cron] 同步完成，共 ${result.synced} 支影片`);
      }
    },
    { timezone: 'Asia/Taipei', name: 'youtube-sync' }
  );
}
