'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, Pencil, Trash2, Eye, Heart, Download, Plus, Newspaper, FolderKanban, Map, Eraser, DatabaseBackup, MessageSquare } from 'lucide-react';

interface Post {
  id: number;
  type: 'blog' | 'portfolio' | 'minecraft';
  title: string;
  published: number;
  views: number;
  likes: number;
  downloads?: number;
  created_at: string;
  tags: string; // JSON string
}

const typeLabel: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  blog: { label: '部落格', color: 'bg-purple-900 text-purple-300', icon: <Newspaper size={12} /> },
  portfolio: { label: '作品集', color: 'bg-blue-900 text-blue-300', icon: <FolderKanban size={12} /> },
  minecraft: { label: 'MC 地圖', color: 'bg-green-900 text-green-300', icon: <Map size={12} /> },
};

export default function AdminDashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'blog' | 'portfolio' | 'minecraft'>('all');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<{ deleted: number; freedBytes: number } | null>(null);
  const [backing, setBacking] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/posts');
    const data = await res.json() as Post[];
    setPosts(data);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchPosts(); }, [fetchPosts]);

  const filtered = posts.filter(p => {
    const matchType = typeFilter === 'all' || p.type === typeFilter;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const handleBackup = async () => {
    setBacking(true);
    try {
      const res = await fetch('/api/admin/backup');
      if (!res.ok) { alert('備份失敗'); return; }
      const blob = await res.blob();
      const date = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `gdnb-backup-${date}.tar.gz`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setBacking(false);
    }
  };

  const handleCleanup = async () => {
    // 先預覽
    const preview = await fetch('/api/admin/cleanup').then(r => r.json()) as { orphans: number; totalBytes: number };
    if (preview.orphans === 0) {
      alert('沒有孤立圖片，不需要清理。');
      return;
    }
    const mb = (preview.totalBytes / 1024 / 1024).toFixed(2);
    if (!confirm(`找到 ${preview.orphans} 張孤立圖片（共 ${mb} MB），確定要刪除？`)) return;
    setCleaning(true);
    setCleanResult(null);
    const res = await fetch('/api/admin/cleanup', { method: 'POST' }).then(r => r.json()) as { deleted: number; freedBytes: number };
    setCleanResult(res);
    setCleaning(false);
  };

  const handleDelete = async (post: Post) => {
    if (!confirm(`確定要刪除「${post.title}」？此操作無法復原。`)) return;
    setDeleting(post.id);
    await fetch(`/api/admin/${post.type}/${post.id}`, { method: 'DELETE' });
    await fetchPosts();
    setDeleting(null);
  };

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.published).length,
    views: posts.reduce((a, p) => a + (p.views || 0), 0),
    downloads: posts.filter(p => p.type === 'minecraft').reduce((a, p) => a + (p.downloads || 0), 0),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">儀表板</h1>
        <div className="flex items-center gap-2">
          {cleanResult && (
            <span className="text-xs text-green-400">
              已刪除 {cleanResult.deleted} 張，釋放 {(cleanResult.freedBytes / 1024 / 1024).toFixed(2)} MB
            </span>
          )}
          <button
            onClick={() => void handleBackup()}
            disabled={backing}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-700"
            title="下載備份"
          >
            {backing
              ? <><div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin" />備份中...</>
              : <><DatabaseBackup size={15} />備份</>
            }
          </button>
          <button
            onClick={() => void handleCleanup()}
            disabled={cleaning}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-700"
            title="清理孤立圖片"
          >
            {cleaning
              ? <><div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin" />清理中...</>
              : <><Eraser size={15} />清理圖片</>
            }
          </button>
          <Link
            href="/admin/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />新增貼文
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: '總貼文', value: stats.total },
          { label: '已發佈', value: stats.published },
          { label: '總觀看', value: stats.views.toLocaleString() },
          { label: '地圖下載', value: stats.downloads.toLocaleString() },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="搜尋貼文..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'blog', 'portfolio', 'minecraft'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === t ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              {t === 'all' ? '全部' : typeLabel[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Post list */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-16">沒有符合條件的貼文</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(post => {
            const meta = typeLabel[post.type];
            const tags: string[] = (() => { try { return JSON.parse(post.tags) as string[]; } catch { return []; } })();
            return (
              <div key={`${post.type}-${post.id}`} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-4 hover:border-gray-700 transition-colors">
                {/* Type badge */}
                <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${meta.color} shrink-0`}>
                  {meta.icon}{meta.label}
                </span>

                {/* Title + tags */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{post.title}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {tags.slice(0, 4).map(t => (
                      <span key={t} className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0">
                  <span className="flex items-center gap-1"><Eye size={12} />{post.views || 0}</span>
                  {post.type !== 'minecraft' && (
                    <span className="flex items-center gap-1"><Heart size={12} />{post.likes || 0}</span>
                  )}
                  {post.type === 'minecraft' && (
                    <span className="flex items-center gap-1"><Download size={12} />{post.downloads || 0}</span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full ${post.published ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                    {post.published ? '已發佈' : '草稿'}
                  </span>
                  <span>{new Date(post.created_at).toLocaleDateString('zh-TW')}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/admin/comments?post_type=${post.type}&post_id=${post.id}&title=${encodeURIComponent(post.title)}`}
                    className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-800 rounded-lg transition-colors"
                    title="留言管理"
                  >
                    <MessageSquare size={15} />
                  </Link>
                  <Link
                    href={`/admin/edit/${post.type}/${post.id}`}
                    className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-colors"
                    title="編輯"
                  >
                    <Pencil size={15} />
                  </Link>
                  <button
                    onClick={() => handleDelete(post)}
                    disabled={deleting === post.id}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                    title="刪除"
                  >
                    {deleting === post.id ? (
                      <div className="w-4 h-4 border border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : <Trash2 size={15} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
