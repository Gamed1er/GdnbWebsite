import type { Components } from 'react-markdown';

interface YouTubeInfo { id: string; start: number; vertical: boolean }

// t=90、t=1m30s、t=1h2m3s → 秒數
function parseStart(t: string | null): number {
  if (!t) return 0;
  if (/^\d+$/.test(t)) return Number(t);
  const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

// 支援 watch?v=、youtu.be/、shorts/、live/、embed/ 等格式
export function parseYouTubeUrl(href: string): YouTubeInfo | null {
  let url: URL;
  try { url = new URL(href); } catch { return null; }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, '');
  let id: string | null = null;
  let vertical = false;

  if (host === 'youtu.be') {
    id = url.pathname.slice(1).split('/')[0];
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const [, kind, value] = url.pathname.split('/');
    if (kind === 'watch') id = url.searchParams.get('v');
    else if (kind === 'shorts') { id = value; vertical = true; }
    else if (kind === 'live' || kind === 'embed') id = value;
  }

  if (!id || !/^[\w-]{11}$/.test(id)) return null;
  return { id, start: parseStart(url.searchParams.get('t') ?? url.searchParams.get('start')), vertical };
}

function YouTubeEmbed({ id, start, vertical }: YouTubeInfo) {
  const src = `https://www.youtube-nocookie.com/embed/${id}${start ? `?start=${start}` : ''}`;
  return (
    <div
      style={{
        margin: '1rem auto',
        width: '100%',
        maxWidth: vertical ? '360px' : undefined,
        aspectRatio: vertical ? '9 / 16' : '16 / 9',
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      <iframe
        src={src}
        title="YouTube video"
        style={{ width: '100%', height: '100%', border: 0 }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

// 共用的 ReactMarkdown components：單獨一行的 YouTube 連結會自動變成內嵌影片
export const markdownComponents: Components = {
  p({ node, children, ...props }) {
    const kids = (node?.children ?? []).filter(c => !(c.type === 'text' && !c.value.trim()));
    // 只處理「裸連結」（連結文字就是網址本身）；[文字](網址) 保留為一般連結
    const a = kids[0];
    if (kids.length === 1 && a.type === 'element' && a.tagName === 'a') {
      const href = String(a.properties?.href ?? '');
      const text = a.children.map(c => (c.type === 'text' ? c.value : '')).join('').trim();
      const info = text === href ? parseYouTubeUrl(href) : null;
      if (info) return <YouTubeEmbed {...info} />;
    }
    return <p {...props}>{children}</p>;
  },
};
