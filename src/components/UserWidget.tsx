'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { signIn, signOut } from 'next-auth/react';

interface MeData {
  role: 'admin' | 'user';
  id?: number;
  name: string;
  avatar?: string | null;
  unreadCount?: number;
}

interface Notification {
  id: number;
  type: string;
  isRead: boolean;
  createdAt: string;
  fromUser: string;
  comment: {
    id: number;
    postType: string | null;
    postId: number | null;
  } | null;
}

function postTypeLabel(t: string | null) {
  if (t === 'blog') return '文章';
  if (t === 'portfolio') return '作品';
  if (t === 'minecraft') return '地圖';
  return '貼文';
}

function postTypeUrl(postType: string | null, postId: number | null) {
  if (!postType || !postId) return null;
  if (postType === 'blog') return `/blog`;
  if (postType === 'portfolio') return `/portfolio/${postId}`;
  if (postType === 'minecraft') return `/minecraft/${postId}`;
  return null;
}

function Avatar({ name, avatar, size = 42 }: { name: string; avatar?: string | null; size?: number }) {
  const letter = (name?.[0] ?? '?').toUpperCase();
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
  const color = colors[letter.charCodeAt(0) % colors.length];

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.42,
      userSelect: 'none', flexShrink: 0,
    }}>
      {letter}
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return '剛剛';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分鐘前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小時前`;
  return `${Math.floor(diff / 86400)} 天前`;
}

export default function UserWidget() {
  const [me, setMe] = useState<MeData | null | 'loading'>('loading');
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch('/api/me');
      if (!res.ok) { setMe(null); return; }
      const data = await res.json();
      setMe(data);
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const fetchNotifs = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const res = await fetch('/api/me/notifications');
      if (res.ok) setNotifs(await res.json());
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    await fetch('/api/me/notifications', { method: 'POST' });
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    setMe(prev => prev && typeof prev === 'object' ? { ...prev, unreadCount: 0 } : prev);
  }, []);

  // 點擊外部關閉
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleToggle = () => {
    if (!open) {
      fetchNotifs();
      fetchMe();
    }
    setOpen(v => !v);
  };

  if (me === 'loading') return null;

  const unread = (me && typeof me === 'object') ? (me.unreadCount ?? 0) : 0;

  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 1000 }}>
      {/* 面板 */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute', bottom: 'calc(100% + 12px)', right: 0,
            width: 280, background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}
        >
          {me ? (
            <>
              {/* 用戶資訊 */}
              <div style={{
                padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
              }}>
                <Avatar name={me.name} avatar={me.avatar} size={40} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {me.name}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {me.role === 'admin' ? '管理員' : '一般用戶'}
                  </div>
                </div>
              </div>

              {/* 通知區塊（僅一般用戶） */}
              {me.role === 'user' && (
                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                  <div style={{
                    padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                      通知 {unread > 0 && <span style={{ color: '#ef4444' }}>（{unread} 則未讀）</span>}
                    </span>
                    {unread > 0 && (
                      <button
                        onClick={markAllRead}
                        style={{
                          background: 'none', border: 'none', color: 'var(--accent-blue-light)',
                          fontSize: '0.75rem', cursor: 'pointer', padding: 0,
                        }}
                      >
                        全部標為已讀
                      </button>
                    )}
                  </div>

                  {loadingNotifs ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>載入中…</div>
                  ) : notifs.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>沒有通知</div>
                  ) : (
                    notifs.map(n => {
                      const url = postTypeUrl(n.comment?.postType ?? null, n.comment?.postId ?? null);
                      const label = postTypeLabel(n.comment?.postType ?? null);
                      return (
                        <div
                          key={n.id}
                          style={{
                            padding: '0.65rem 1rem',
                            borderBottom: '1px solid var(--border)',
                            background: n.isRead ? 'transparent' : 'rgba(59,130,246,0.06)',
                          }}
                        >
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                            {!n.isRead && (
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0, marginTop: 6 }} />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.4 }}>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{n.fromUser}</span>
                                {' '}回覆了你在{' '}
                                {url ? (
                                  <a href={url} style={{ color: 'var(--accent-blue-light)', textDecoration: 'none' }}>{label}</a>
                                ) : label}
                                {' '}的留言
                              </div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 2 }}>
                                {timeAgo(n.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* 登出 */}
              <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => signOut()}
                  style={{
                    width: '100%', padding: '0.5rem', borderRadius: 6,
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    color: '#f87171', fontSize: '0.85rem', cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                >
                  登出
                </button>
              </div>
            </>
          ) : (
            /* 未登入 */
            <div style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1rem' }}>
                登入後可留言與接收通知
              </div>
              <button
                onClick={() => signIn('google')}
                style={{
                  width: '100%', padding: '0.6rem 1rem', borderRadius: 8,
                  background: '#fff', border: 'none',
                  color: '#333', fontWeight: 600, fontSize: '0.88rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '0.5rem',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                使用 Google 登入
              </button>
            </div>
          )}
        </div>
      )}

      {/* 頭像按鈕 */}
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{
          width: 50, height: 50, borderRadius: '50%',
          border: open ? '2px solid var(--accent-blue)' : '2px solid var(--border)',
          background: 'var(--bg-card)',
          cursor: 'pointer', padding: 0, position: 'relative',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          transition: 'border-color 0.15s, transform 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'visible',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.transform = 'scale(1.05)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        title={me ? `${(me as MeData).name}` : '登入'}
      >
        {me ? (
          <Avatar name={(me as MeData).name} avatar={(me as MeData).avatar} size={46} />
        ) : (
          /* 未登入：人形圖示 */
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        )}

        {/* 紅點（未讀通知） */}
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            width: 18, height: 18, borderRadius: '50%',
            background: '#ef4444', border: '2px solid var(--bg-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '0.6rem', fontWeight: 700,
            lineHeight: 1,
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  );
}
