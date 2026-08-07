// 留言 Rate Limiter：每分鐘最多 5 則，存在 memory（PM2 保持 process 存活）

const store = new Map<number, { count: number; windowStart: number }>();

const WINDOW_MS = 60_000; // 1 分鐘
const MAX_REQUESTS = 5;

// 定時清理過期記錄（每 5 分鐘）
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store) {
    if (now - val.windowStart > WINDOW_MS) store.delete(key);
  }
}, 5 * 60_000);

export function checkRateLimit(userId: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(userId);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    store.set(userId, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS - entry.count };
}
