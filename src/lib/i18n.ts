export const ui = {
  zh: {
    // Navbar
    nav: {
      home: '主頁',
      blog: '部落格',
      portfolio: '作品集',
      minecraft: 'MC 創作下載',
      videos: '影片',
    },
    // 通用
    common: {
      loading: '載入中...',
      search: '搜尋',
      tags: '標籤：',
      all: '全部',
      views: '次觀看',
      likes: '個喜歡',
      downloads: '次下載',
      noResults: '找不到符合的結果',
      readMore: '閱讀更多',
    },
    // 部落格
    blog: {
      title: '部落格',
      subtitle: '教學、心得，以及各種想法',
      searchPlaceholder: '搜尋文章...',
      empty: '目前還沒有文章',
    },
    // 作品集
    portfolio: {
      title: '作品集',
      subtitle: '我做過的遊戲和專案',
      searchPlaceholder: '搜尋作品...',
      empty: '目前還沒有作品',
      viewProject: '查看專案',
    },
    // Minecraft
    minecraft: {
      title: 'MC 創作下載',
      subtitle: '我製作的 Minecraft 地圖，全部免費下載',
      searchPlaceholder: '搜尋地圖...',
      empty: '目前還沒有地圖',
      downloadMap: '下載地圖',
      downloadResourcepack: '資源包',
      version: '版本',
      hasResourcepack: '含資源包',
    },
    // 影片
    videos: {
      title: '影片',
      subtitle: '我的 YouTube 頻道影片，自動同步更新',
      subscribeBtn: '前往頻道訂閱',
      empty: '尚未同步任何影片',
      emptyHint: '請先設定 YouTube API Key，然後在管理員後台執行同步',
      langBadge: '中文為主 · EN available',
    },
  },
  en: {
    nav: {
      home: 'Home',
      blog: 'Blog',
      portfolio: 'Portfolio',
      minecraft: 'MC Downloads',
      videos: 'Videos',
    },
    common: {
      loading: 'Loading...',
      search: 'Search',
      tags: 'Tags:',
      all: 'All',
      views: 'views',
      likes: 'likes',
      downloads: 'downloads',
      noResults: 'No results found',
      readMore: 'Read more',
    },
    blog: {
      title: 'Blog',
      subtitle: 'Tutorials, thoughts, and things worth sharing',
      searchPlaceholder: 'Search posts...',
      empty: 'No posts yet',
    },
    portfolio: {
      title: 'Portfolio',
      subtitle: 'Games and projects I\'ve built',
      searchPlaceholder: 'Search projects...',
      empty: 'No projects yet',
      viewProject: 'View Project',
    },
    minecraft: {
      title: 'MC Map Downloads',
      subtitle: 'Minecraft maps I made — all free to download',
      searchPlaceholder: 'Search maps...',
      empty: 'No maps yet',
      downloadMap: 'Download Map',
      downloadResourcepack: 'Resource Pack',
      version: 'Version',
      hasResourcepack: 'Includes Resource Pack',
    },
    videos: {
      title: 'Videos',
      subtitle: 'My YouTube channel, synced automatically',
      subscribeBtn: 'Subscribe on YouTube',
      empty: 'No videos synced yet',
      emptyHint: 'Set up your YouTube API Key and run a sync from the admin panel.',
      langBadge: '中文 (Chinese) · EN available',
    },
  },
} as const;

export type Lang = keyof typeof ui;
