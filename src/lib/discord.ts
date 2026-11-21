const DEFAULT_ROLE_ID = '1354481826420232193';

type NotifyPostType = 'blog' | 'portfolio' | 'minecraft';

const TYPE_META: Record<NotifyPostType, { label: string; path: string; color: number }> = {
  blog: { label: '📝 新部落格文章', path: 'blog', color: 0x3b82f6 },
  portfolio: { label: '🎮 新作品集', path: 'portfolio', color: 0x8b5cf6 },
  minecraft: { label: '🧱 新 MC 創作下載', path: 'minecraft', color: 0x22c55e },
};

interface NotifyNewPostParams {
  type: NotifyPostType;
  id: number;
  title: string;
  description?: string | null;
  coverImage?: string | null;
}

function toAbsoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://gdnb.net';
  return `${base.replace(/\/$/, '')}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_`>~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * 發布新內容時通知 Discord 頻道（提及指定身分組）。未設定 DISCORD_BOT_TOKEN /
 * DISCORD_CHANNEL_ID 時靜默跳過。回傳是否成功送出，讓呼叫端決定是否標記
 * discord_notified（失敗時不標記，讓下次編輯可以重試）。
 */
export async function notifyNewPost({ type, id, title, description, coverImage }: NotifyNewPostParams): Promise<boolean> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID;
  if (!token || !channelId) return false;

  const roleId = process.env.DISCORD_ROLE_ID || DEFAULT_ROLE_ID;

  const meta = TYPE_META[type];
  const url = toAbsoluteUrl(`/${meta.path}/${id}`);

  const embed: Record<string, unknown> = {
    title,
    url,
    color: meta.color,
  };
  if (description) embed.description = truncate(stripMarkdown(description), 200);
  if (coverImage) embed.image = { url: toAbsoluteUrl(coverImage) };

  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `<@&${roleId}> ${meta.label}`,
        embeds: [embed],
        allowed_mentions: { roles: [roleId] },
      }),
    });
    if (!res.ok) {
      console.error(`[discord] notify failed (${res.status}): ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[discord] notify error:', err);
    return false;
  }
}
