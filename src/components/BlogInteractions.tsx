'use client';

import { useEffect, useState } from 'react';
import { Eye, Heart } from 'lucide-react';

interface Props {
  slug: string;
  initialViews: number;
  initialLikes: number;
  // 可自訂 API 路徑，預設為 blog
  viewUrl?: string;
  likeUrl?: string;
  storageKey?: string;
}

export default function BlogInteractions({
  slug,
  initialViews,
  initialLikes,
  viewUrl,
  likeUrl,
  storageKey,
}: Props) {
  const [views, setViews] = useState(initialViews);
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const resolvedViewUrl = viewUrl ?? `/api/blog/${slug}/view`;
  const resolvedLikeUrl = likeUrl ?? `/api/blog/${slug}/like`;
  const resolvedStorageKey = storageKey ?? `liked_blog_${slug}`;

  useEffect(() => {
    fetch(resolvedViewUrl, { method: 'POST' })
      .then((r) => r.json())
      .then((d) => setViews(d.views));

    if (localStorage.getItem(resolvedStorageKey) === '1') setLiked(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes((prev) => prev + (newLiked ? 1 : -1));
    try {
      const res = await fetch(resolvedLikeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: newLiked ? 'like' : 'unlike' }),
      });
      const data = await res.json();
      setLikes(data.likes);
      localStorage.setItem(resolvedStorageKey, newLiked ? '1' : '0');
    } catch {
      setLiked(!newLiked);
      setLikes((prev) => prev + (newLiked ? -1 : 1));
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        <Eye size={16} /> {views.toLocaleString()} 次觀看
      </span>
      <button
        onClick={handleLike}
        disabled={likeLoading}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 18px', borderRadius: '9999px',
          border: `1px solid ${liked ? '#f43f5e' : 'var(--border)'}`,
          background: liked ? 'rgba(244,63,94,0.12)' : 'var(--bg-card)',
          color: liked ? '#f43f5e' : 'var(--text-muted)',
          cursor: likeLoading ? 'not-allowed' : 'pointer',
          fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.2s',
        }}
      >
        <Heart size={16} fill={liked ? '#f43f5e' : 'none'} style={{ transition: 'all 0.2s' }} />
        {likes.toLocaleString()}
      </button>
    </div>
  );
}
