'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Flag, ChevronLeft, ChevronRight, ExternalLink, ArrowLeft } from 'lucide-react';

interface AdminComment {
  id: number;
  postType: string;
  postId: number;
  content: string | null;
  isDeleted: boolean;
  deletedBy: string | null;
  parentId: number | null;
  createdAt: string;
  reportCount: number;
  user: { id: number; name: string; email: string; isBanned: boolean };
}

const POST_TYPE_LABEL: Record<string, string> = {
  blog: '部落格', portfolio: '作品集', minecraft: 'MC 地圖',
};

const POST_TYPE_URL: Record<string, (id: number) => string> = {
  blog: () => '/blog',
  portfolio: id => `/portfolio/${id}`,
  minecraft: id => `/minecraft/${id}`,
};

function AdminCommentsPage() {
  const searchParams = useSearchParams();
  // 從 URL 讀取貼文過濾（從儀表板點進來時帶有這兩個參數）
  const urlPostType = searchParams.get('post_type') ?? '';
  const urlPostId = searchParams.get('post_id') ?? '';
  const urlPostTitle = searchParams.get('title') ?? '';

  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [postType, setPostType] = useState(urlPostType);
  const [reported, setReported] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<number | null>(null);

  // 是否是「特定貼文」模式
  const isPostSpecific = !!urlPostId;

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (postType) params.set('post_type', postType);
    if (urlPostId) params.set('post_id', urlPostId);
    if (reported) params.set('reported', '1');
    const res = await fetch(`/api/admin/comments?${params}`);
    const data = await res.json() as { comments: AdminComment[]; total: number; pages: number };
    setComments(data.comments);
    setTotal(data.total);
    setPages(data.pages);
    setLoading(false);
  }, [page, postType, urlPostId, reported]);

  useEffect(() => { void fetchComments(); }, [fetchComments]);

  // 過濾條件改變時重置頁碼
  useEffect(() => { setPage(1); }, [postType, reported]);

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除這則留言？')) return;
    setDeleting(id);
    await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    await fetchComments();
    setDeleting(null);
  };

  return (
    <div>
      {/* 標題 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {isPostSpecific && (
            <Link href="/admin/comments" className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft size={18} />
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isPostSpecific ? `「${urlPostTitle || '貼文'}」的留言` : '留言管理'}
            </h1>
            {isPostSpecific && (
              <p className="text-gray-500 text-sm mt-0.5">
                {POST_TYPE_LABEL[urlPostType] ?? urlPostType} · ID {urlPostId}
              </p>
            )}
          </div>
        </div>
        <span className="text-gray-400 text-sm">共 {total} 則</span>
      </div>

      {/* 過濾器（貼文模式不顯示類型切換） */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex gap-1">
          {!isPostSpecific && (['', 'blog', 'portfolio', 'minecraft'] as const).map(t => (
            <button
              key={t}
              onClick={() => setPostType(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                postType === t ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              {t === '' ? '全部' : POST_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <button
          onClick={() => setReported(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            reported ? 'bg-red-700 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-700'
          }`}
        >
          <Flag size={13} />被檢舉
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center text-gray-500 py-16">沒有留言</div>
      ) : (
        <div className="space-y-2">
          {comments.map(c => (
            <div
              key={c.id}
              className={`bg-gray-900 border rounded-xl p-4 transition-colors ${
                c.isDeleted ? 'border-gray-800 opacity-60' : c.reportCount > 0 ? 'border-red-900' : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* 左側：類型 + 作者 */}
                <div className="shrink-0 w-28">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-1 ${
                    c.postType === 'blog' ? 'bg-purple-900 text-purple-300' :
                    c.postType === 'portfolio' ? 'bg-blue-900 text-blue-300' :
                    'bg-green-900 text-green-300'
                  }`}>
                    {POST_TYPE_LABEL[c.postType] ?? c.postType}
                  </span>
                  <div className="text-xs text-gray-400 truncate">{c.user.name}</div>
                  <div className="text-xs text-gray-600 truncate">{c.user.email}</div>
                  {c.user.isBanned && (
                    <span className="text-xs text-red-500">已封禁</span>
                  )}
                </div>

                {/* 中間：內容 */}
                <div className="flex-1 min-w-0">
                  {c.isDeleted ? (
                    <span className="text-gray-600 text-sm italic">
                      [{c.deletedBy === 'admin' ? '管理員已刪除' : '用戶已刪除'}]
                    </span>
                  ) : (
                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">{c.content}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-gray-600">
                      {new Date(c.createdAt).toLocaleString('zh-TW')}
                    </span>
                    {c.parentId && <span className="text-xs text-gray-600">（回覆）</span>}
                    {c.reportCount > 0 && (
                      <span className="text-xs text-red-500 flex items-center gap-0.5">
                        <Flag size={10} />{c.reportCount} 則檢舉
                      </span>
                    )}
                  </div>
                </div>

                {/* 右側：操作 */}
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={POST_TYPE_URL[c.postType]?.(c.postId) ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-colors"
                    title="前往貼文"
                  >
                    <ExternalLink size={14} />
                  </a>
                  {!c.isDeleted && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deleting === c.id}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                      title="刪除留言"
                    >
                      {deleting === c.id
                        ? <div className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                        : <Trash2 size={14} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分頁 */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-gray-400 text-sm">第 {page} / {pages} 頁</span>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

// useSearchParams 需要 Suspense 包裹
import { Suspense } from 'react';
export default function AdminCommentsPageWrapper() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-32"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <AdminCommentsPage />
    </Suspense>
  );
}
