-- gdnb.net 資料庫 Schema
-- SQLite

-- 使用者（管理員）
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin', -- 'admin' | 'editor'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 部落格文章
CREATE TABLE IF NOT EXISTS blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,              -- Markdown
  excerpt TEXT,
  cover_image TEXT,
  tags TEXT NOT NULL DEFAULT '[]',    -- JSON array
  published INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 作品集
CREATE TABLE IF NOT EXISTS portfolio_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,          -- Markdown
  cover_image TEXT,
  github_url TEXT,
  extra_links TEXT NOT NULL DEFAULT '[]', -- JSON array [{label, url}]
  tags TEXT NOT NULL DEFAULT '[]',
  published INTEGER NOT NULL DEFAULT 1,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Minecraft 地圖
CREATE TABLE IF NOT EXISTS minecraft_maps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,          -- Markdown
  cover_image TEXT,
  file_path TEXT,
  file_size INTEGER,
  datapack_path TEXT,
  datapack_size INTEGER,
  resourcepack_path TEXT,
  resourcepack_size INTEGER,
  version TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  downloads INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 下載記錄
CREATE TABLE IF NOT EXISTS download_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  map_id INTEGER NOT NULL REFERENCES minecraft_maps(id),
  downloaded_at TEXT NOT NULL DEFAULT (date('now')),
  ip_hash TEXT
);

-- 觀看記錄（用於每日統計圖表）
CREATE TABLE IF NOT EXISTS view_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_type TEXT NOT NULL,   -- 'blog' | 'portfolio' | 'minecraft'
  content_id INTEGER NOT NULL,
  viewed_at TEXT NOT NULL DEFAULT (date('now'))
);

-- 點讚記錄（防止重複點讚用，以 IP hash 為主）
-- 實際去重在前端 localStorage 處理，此表為備用統計
-- （暫時不用，保留欄位備用）

-- 一般使用者（Google OAuth 登入）
CREATE TABLE IF NOT EXISTS public_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  nickname TEXT,                        -- 自訂暱稱，最多 32 字元
  avatar_url TEXT,                      -- Google 頭貼或自訂圖片路徑
  bio TEXT,                             -- 個人說明（Markdown）
  is_banned INTEGER NOT NULL DEFAULT 0,
  ban_until DATETIME,                   -- NULL = 永久禁言
  ban_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 留言
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_type TEXT NOT NULL,              -- 'blog' | 'portfolio' | 'minecraft'
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL REFERENCES public_users(id),
  content TEXT NOT NULL,               -- max 1024 字元，Markdown
  parent_id INTEGER REFERENCES comments(id),  -- 最多一層巢狀回覆
  is_deleted INTEGER NOT NULL DEFAULT 0,
  deleted_by TEXT,                     -- 'user' | 'admin'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 留言檢舉
CREATE TABLE IF NOT EXISTS comment_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL REFERENCES comments(id),
  reporter_id INTEGER NOT NULL REFERENCES public_users(id),
  reason TEXT,
  resolved INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 通知
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES public_users(id),
  type TEXT NOT NULL DEFAULT 'reply',
  from_user_id INTEGER REFERENCES public_users(id),
  comment_id INTEGER REFERENCES comments(id),
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 留言黑名單關鍵字
CREATE TABLE IF NOT EXISTS comment_blacklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- YouTube 影片快取
CREATE TABLE IF NOT EXISTS youtube_videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  published_at DATETIME,
  duration TEXT,
  video_type TEXT NOT NULL DEFAULT 'video',
  view_count INTEGER DEFAULT 0,
  synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 網站設定
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO site_settings (key, value) VALUES
  ('site_title', '遊戲亡'),
  ('site_description', 'Minecraft 地圖、遊戲開發、影音創作'),
  ('youtube_channel_id', ''),
  ('youtube_last_sync', ''),
  ('hero_tagline', '歡迎來到遊戲亡的個人網站');

-- 索引
CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_published ON portfolio_items(published, sort_order);
CREATE INDEX IF NOT EXISTS idx_minecraft_published ON minecraft_maps(published, sort_order);
CREATE INDEX IF NOT EXISTS idx_youtube_published ON youtube_videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_view_logs ON view_logs(content_type, content_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_download_logs ON download_logs(map_id, downloaded_at);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_type, post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
