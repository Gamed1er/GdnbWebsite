/**
 * Seed script — 執行：node database/seed.js
 * 會建立資料表、執行 migration、插入測試資料和 admin 帳號
 */
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// 讀取 .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const DB_PATH = path.join(__dirname, 'gdnb.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 建立/更新資料表
const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema);

// ── Migration：為舊版 DB 補欄位 ─────────────────────────
const migrations = [
  'ALTER TABLE blog_posts ADD COLUMN likes INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE portfolio_items ADD COLUMN views INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE portfolio_items ADD COLUMN likes INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE portfolio_items ADD COLUMN extra_links TEXT NOT NULL DEFAULT \'[]\'',
  'ALTER TABLE portfolio_items ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP',
  'ALTER TABLE minecraft_maps ADD COLUMN resourcepack_path TEXT',
  'ALTER TABLE minecraft_maps ADD COLUMN resourcepack_size INTEGER',
  'ALTER TABLE minecraft_maps ADD COLUMN views INTEGER NOT NULL DEFAULT 0',
  "ALTER TABLE youtube_videos ADD COLUMN video_type TEXT NOT NULL DEFAULT 'video'",
  'ALTER TABLE minecraft_maps ADD COLUMN datapack_path TEXT',
  'ALTER TABLE minecraft_maps ADD COLUMN datapack_size INTEGER',
];
for (const sql of migrations) {
  try { db.prepare(sql).run(); } catch (_) { /* 欄位已存在，忽略 */ }
}

// ── Admin 帳號 ───────────────────────────────────────────
// 從 .env.local 讀取，格式：
//   ADMIN_USERNAME=你的帳號
//   ADMIN_PASSWORD=你的密碼
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error('❌ 請在 .env.local 設定 ADMIN_PASSWORD');
  process.exit(1);
}

const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get(ADMIN_USERNAME);
const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
if (!existingAdmin) {
  db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(ADMIN_USERNAME, hash, 'admin');
  console.log(`✅ 建立帳號（帳號：${ADMIN_USERNAME}，密碼：${ADMIN_PASSWORD}）`);
} else {
  db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hash, ADMIN_USERNAME);
  console.log(`✅ 更新密碼（帳號：${ADMIN_USERNAME}，密碼：${ADMIN_PASSWORD}）`);
}

// ── 建立 uploads 目錄 ────────────────────────────────────
const uploadsDir = path.join(__dirname, '..', 'public', 'images', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ 建立 public/images/uploads 目錄');
}

console.log(`✅ Seed 完成！帳號：${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
db.close();
