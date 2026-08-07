import getDb from '@/lib/db';

let cachedKeywords: string[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60_000; // 5 分鐘重新載入一次

function getKeywords(): string[] {
  const now = Date.now();
  if (cachedKeywords && now - cacheTime < CACHE_TTL) return cachedKeywords;
  const db = getDb();
  const rows = db.prepare('SELECT keyword FROM comment_blacklist').all() as { keyword: string }[];
  cachedKeywords = rows.map(r => r.keyword);
  cacheTime = now;
  return cachedKeywords;
}

export function invalidateKeywordCache() {
  cachedKeywords = null;
}

export function filterComment(content: string): { blocked: boolean; keyword?: string } {
  const keywords = getKeywords();
  for (const kw of keywords) {
    if (content.includes(kw)) {
      return { blocked: true, keyword: kw };
    }
  }
  return { blocked: false };
}
