'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Ban, ShieldCheck, Trash2, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';

interface AdminUser {
  id: number;
  name: string;
  displayName: string;
  email: string;
  avatar: string | null;
  isBanned: boolean;
  banUntil: string | null;
  banReason: string | null;
  createdAt: string;
  commentCount: number;
}

interface Keyword {
  id: number;
  keyword: string;
  created_at: string;
}

function Avatar({ name, avatar, size = 32 }: { name: string; avatar?: string | null; size?: number }) {
  const letter = (name?.[0] ?? '?').toUpperCase();
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
  const color = colors[letter.charCodeAt(0) % colors.length];
  if (avatar) {
    return <img src={avatar} alt={name} width={size} height={size} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} referrerPolicy="no-referrer" />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.42, userSelect: 'none', flexShrink: 0 }}>
      {letter}
    </div>
  );
}

interface BanModalProps {
  user: AdminUser;
  onClose: () => void;
  onBanned: () => void;
}

function BanModal({ user, onClose, onBanned }: BanModalProps) {
  const [reason, setReason] = useState('');
  const [days, setDays] = useState<string>('7');
  const [permanent, setPermanent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await fetch(`/api/admin/users/${user.id}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason || null, days: permanent ? null : Number(days) }),
    });
    setLoading(false);
    onBanned();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1a2035', border: '1px solid #1e2d4a', borderRadius: 12, padding: '1.5rem', width: 360, maxWidth: '90vw' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">封禁用戶：{user.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-gray-400 text-sm block mb-1">原因（選填）</label>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="封禁原因..."
              maxLength={200}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-gray-400 text-sm cursor-pointer mb-2">
              <input type="checkbox" checked={permanent} onChange={e => setPermanent(e.target.checked)} className="accent-red-500" />
              永久封禁
            </label>
            {!permanent && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={days}
                  onChange={e => setDays(e.target.value)}
                  className="w-24 bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <span className="text-gray-400 text-sm">天</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white text-sm transition-colors">取消</button>
          <button
            onClick={() => void handleSubmit()}
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {loading ? '處理中...' : '確認封禁'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [unbanning, setUnbanning] = useState<number | null>(null);

  // 黑名單
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [addingKw, setAddingKw] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json() as { users: AdminUser[]; total: number; pages: number };
    setUsers(data.users);
    setTotal(data.total);
    setPages(data.pages);
    setLoading(false);
  }, [page, search]);

  const fetchKeywords = useCallback(async () => {
    const res = await fetch('/api/admin/blacklist');
    if (res.ok) setKeywords(await res.json() as Keyword[]);
  }, []);

  useEffect(() => { void fetchUsers(); }, [fetchUsers]);
  useEffect(() => { void fetchKeywords(); }, [fetchKeywords]);
  useEffect(() => { setPage(1); }, [search]);

  const handleUnban = async (id: number) => {
    setUnbanning(id);
    await fetch(`/api/admin/users/${id}/ban`, { method: 'DELETE' });
    await fetchUsers();
    setUnbanning(null);
  };

  const handleAddKeyword = async () => {
    const kw = newKeyword.trim();
    if (!kw) return;
    setAddingKw(true);
    const res = await fetch('/api/admin/blacklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: kw }),
    });
    if (res.ok) {
      setNewKeyword('');
      await fetchKeywords();
    } else {
      const data = await res.json() as { error?: string };
      alert(data.error ?? '新增失敗');
    }
    setAddingKw(false);
  };

  const handleDeleteKeyword = async (id: number) => {
    await fetch(`/api/admin/blacklist?id=${id}`, { method: 'DELETE' });
    await fetchKeywords();
  };

  return (
    <div>
      {banTarget && (
        <BanModal
          user={banTarget}
          onClose={() => setBanTarget(null)}
          onBanned={() => { void fetchUsers(); }}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">用戶管理</h1>
        <span className="text-gray-400 text-sm">共 {total} 位</span>
      </div>

      {/* 搜尋 */}
      <div className="relative max-w-sm mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜尋姓名 / Email..."
          className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* 用戶列表 */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center text-gray-500 py-12">沒有用戶</div>
      ) : (
        <div className="space-y-2 mb-8">
          {users.map(u => (
            <div
              key={u.id}
              className={`bg-gray-900 border rounded-xl px-4 py-3 flex items-center gap-3 transition-colors ${
                u.isBanned ? 'border-red-900' : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              <Avatar name={u.name} avatar={u.avatar} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white text-sm font-medium">{u.name}</span>
                  {u.isBanned && (
                    <span className="text-xs text-red-400 bg-red-900/30 px-2 py-0.5 rounded-full">
                      {u.banUntil ? `封禁至 ${new Date(u.banUntil).toLocaleDateString('zh-TW')}` : '永久封禁'}
                    </span>
                  )}
                </div>
                <div className="text-gray-500 text-xs mt-0.5 truncate">{u.email}</div>
                {u.banReason && <div className="text-gray-600 text-xs mt-0.5">原因：{u.banReason}</div>}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
                <span>{u.commentCount} 則留言</span>
                <span>{new Date(u.createdAt).toLocaleDateString('zh-TW')}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {u.isBanned ? (
                  <button
                    onClick={() => handleUnban(u.id)}
                    disabled={unbanning === u.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-green-400 hover:text-white bg-green-900/30 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                    title="解除封禁"
                  >
                    {unbanning === u.id
                      ? <div className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
                      : <ShieldCheck size={13} />}
                    解封
                  </button>
                ) : (
                  <button
                    onClick={() => setBanTarget(u)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-400 hover:text-white bg-red-900/30 hover:bg-red-700 rounded-lg transition-colors"
                    title="封禁用戶"
                  >
                    <Ban size={13} />封禁
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分頁 */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mb-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30">
            <ChevronLeft size={18} />
          </button>
          <span className="text-gray-400 text-sm">第 {page} / {pages} 頁</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30">
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* 黑名單管理 */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-white font-bold mb-4 flex items-center gap-2">
          <Ban size={16} className="text-red-400" />留言關鍵字黑名單
        </h2>

        {/* 新增 */}
        <div className="flex gap-2 mb-4">
          <input
            value={newKeyword}
            onChange={e => setNewKeyword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void handleAddKeyword(); }}
            placeholder="新增關鍵字..."
            maxLength={50}
            className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => void handleAddKeyword()}
            disabled={addingKw || !newKeyword.trim()}
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
          >
            <Plus size={14} />新增
          </button>
        </div>

        {/* 關鍵字列表 */}
        {keywords.length === 0 ? (
          <p className="text-gray-600 text-sm">尚無關鍵字</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {keywords.map(kw => (
              <span
                key={kw.id}
                className="flex items-center gap-1.5 bg-gray-800 text-gray-300 text-sm px-3 py-1 rounded-full"
              >
                {kw.keyword}
                <button
                  onClick={() => handleDeleteKeyword(kw.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                  title="刪除"
                >
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
