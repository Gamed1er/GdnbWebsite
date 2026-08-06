/**
 * Seed script — 執行：node database/seed.js
 * 會建立資料表、執行 migration、插入測試資料和 admin 帳號
 */
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

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
];
for (const sql of migrations) {
  try { db.prepare(sql).run(); } catch (_) { /* 欄位已存在，忽略 */ }
}

// ── Admin 帳號 ───────────────────────────────────────────
const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!existingAdmin) {
  const hash = bcrypt.hashSync('password123', 10);
  db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('admin', hash, 'admin');
  console.log('✅ 建立 admin 帳號（密碼：password123），請登入後立即更改！');
} else {
  console.log('ℹ️  Admin 帳號已存在，跳過');
}

// ── 作品集測試資料 ────────────────────────────────────────
db.prepare('DELETE FROM portfolio_items').run();

const insertPortfolio = db.prepare(`
  INSERT INTO portfolio_items (title, description, cover_image, github_url, extra_links, tags, published, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, 1, ?)
`);

insertPortfolio.run(
  '作品 A',
  `# 作品 A\n\n這是一個用 **Python** 開發的測試專案。\n\n## 功能介紹\n\n- 功能一：做了一些很厲害的事情\n- 功能二：又做了另一件很厲害的事情\n\n## 技術細節\n\n使用 Python 3.11 開發，核心邏輯用了 \`asyncio\` 做非同步處理。\n\n\`\`\`python\nimport asyncio\n\nasync def main():\n    print("Hello from 作品 A!")\n\nasyncio.run(main())\n\`\`\`\n`,
  null,
  'https://github.com/gdnb/project-a',
  JSON.stringify([]),
  JSON.stringify(['Python']),
  1
);

insertPortfolio.run(
  '作品 B',
  `# 作品 B\n\n這是一個用 **Unity** 和 **C#** 開發的遊戲專案。\n\n## 遊戲介紹\n\n一個 2D 平台跳躍遊戲，玩家需要躲避障礙物並收集星星。\n\n## 技術細節\n\n\`\`\`csharp\npublic class PlayerController : MonoBehaviour\n{\n    public float speed = 5f;\n    void Update()\n    {\n        float move = Input.GetAxis("Horizontal");\n        transform.Translate(move * speed * Time.deltaTime, 0, 0);\n    }\n}\n\`\`\`\n`,
  null,
  'https://github.com/gdnb/project-b',
  JSON.stringify([{ label: 'itch.io', url: 'https://itch.io' }]),
  JSON.stringify(['Unity', 'C#']),
  2
);

// ── 部落格測試資料 ────────────────────────────────────────
db.prepare('DELETE FROM blog_posts').run();

const insertBlog = db.prepare(`
  INSERT INTO blog_posts (slug, title, content, tags, published)
  VALUES (?, ?, ?, ?, 1)
`);

insertBlog.run(
  'hello-world',
  '你好，世界！這是我的第一篇文章',
  `# 你好，世界！\n\n歡迎來到我的部落格。這裡會分享一些學習心得、教學，以及各種有趣的東西。\n\n## 為什麼要寫部落格？\n\n1. **整理思路**：把腦袋裡的東西寫出來，才知道自己真的懂了沒\n2. **分享知識**：說不定能幫助到有同樣問題的人\n3. **記錄成長**：幾年後回頭看，會很有感\n\n> 「開始永遠比完美更重要。」\n`,
  JSON.stringify(['隨筆', '介紹'])
);

insertBlog.run(
  'minecraft-map-dev-tips',
  'Minecraft 地圖開發：5 個讓你少走彎路的技巧',
  `# Minecraft 地圖開發：5 個讓你少走彎路的技巧\n\n做 Minecraft 地圖一段時間了，踩過不少坑。這篇整理了 5 個最實用的技巧。\n\n## 1. 善用結構方塊\n\n\`\`\`\n/give @p structure_block\n\`\`\`\n\n## 2. 用 Scoreboard 做遊戲計分\n\n\`\`\`\n/scoreboard objectives add score dummy "分數"\n/scoreboard players add @p score 1\n\`\`\`\n\n## 3. 測試環境分開\n\n永遠不要在正式地圖上直接測試。\n\n## 4. 備份！備份！備份！\n\n每次大改動前一定要備份整個世界資料夾。\n\n## 5. 先設計再建造\n\n花 30 分鐘畫草圖，能省下 3 小時的重建時間。\n`,
  JSON.stringify(['Minecraft', '教學', '地圖開發'])
);

// ── Minecraft 地圖測試資料 ────────────────────────────────
db.prepare('DELETE FROM minecraft_maps').run();

const insertMap = db.prepare(`
  INSERT INTO minecraft_maps (title, description, file_path, file_size, resourcepack_path, version, tags, downloads, published, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
`);

insertMap.run(
  '測試冒險地圖 v1.0',
  `# 測試冒險地圖 v1.0\n\n這是一張測試用的冒險地圖，故事背景設定在一個被詛咒的古老遺跡中。\n\n## 地圖特色\n\n- 約 2 小時遊玩時間\n- 包含解謎、戰鬥和劇情對話\n- 支援 1-4 人遊玩\n\n## 遊玩方式\n\n1. 下載地圖壓縮檔\n2. 解壓縮到 Minecraft saves 資料夾\n3. 開啟遊戲選擇地圖\n\n**此地圖附有資源包，強烈建議安裝！**\n`,
  '/maps/test-adventure-map.zip',
  null,
  '/maps/test-adventure-resourcepack.zip',
  '1.20.4',
  JSON.stringify(['冒險', '解謎', '劇情', '多人']),
  42,
  1
);

insertMap.run(
  '生存挑戰：零資源開始',
  `# 生存挑戰：零資源開始\n\n在幾乎沒有資源的世界中生存下去。\n\n## 挑戰規則\n\n- 從一座小島開始，島上只有一棵樹\n- 完成所有成就才算通關\n- 難度建議設為困難\n`,
  '/maps/skyblock-challenge.zip',
  null,
  null,
  '1.20.x',
  JSON.stringify(['生存', '挑戰', '空島']),
  18,
  2
);

// ── 建立 uploads 目錄 ────────────────────────────────────
const uploadsDir = path.join(__dirname, '..', 'public', 'images', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ 建立 public/images/uploads 目錄');
}

console.log('✅ Seed 完成！admin 帳號：admin / password123');
db.close();
