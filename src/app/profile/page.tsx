'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Check, X } from 'lucide-react';

interface MeData {
  role: 'admin' | 'user';
  id: number;
  name: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
  createdAt: string;
}

function compressImage(file: File, maxSize = 256): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const size = Math.min(img.width, img.height, maxSize);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      // 裁切正方形（中心）
      const sx = (img.width - Math.min(img.width, img.height)) / 2;
      const sy = (img.height - Math.min(img.width, img.height)) / 2;
      const sq = Math.min(img.width, img.height);
      ctx.drawImage(img, sx, sy, sq, sq, 0, 0, size, size);
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('壓縮失敗'));
      }, 'image/webp', 0.85);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);

  const [nickname, setNickname] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const fetchMe = useCallback(async () => {
    const res = await fetch('/api/me');
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json() as MeData;
    setMe(data);
    setNickname(data.name); // nickname 或 displayName 的顯示值
    setLoading(false);
  }, [router]);

  useEffect(() => { void fetchMe(); }, [fetchMe]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 256);
      const compressedFile = new File([compressed], 'avatar.webp', { type: 'image/webp' });
      setAvatarFile(compressedFile);
      setAvatarPreview(URL.createObjectURL(compressed));
    } catch {
      setMessage({ type: 'err', text: '圖片處理失敗，請重試' });
    }
    // reset input 讓同一個檔案可以重選
    e.target.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      let newAvatarUrl: string | undefined;

      // 上傳頭貼
      if (avatarFile) {
        const fd = new FormData();
        fd.append('file', avatarFile);
        const res = await fetch('/api/me/avatar', { method: 'POST', body: fd });
        if (!res.ok) {
          const err = await res.json() as { error?: string };
          throw new Error(err.error ?? '頭貼上傳失敗');
        }
        const data = await res.json() as { avatarUrl: string };
        newAvatarUrl = data.avatarUrl;
      }

      // 更新暱稱
      const patchBody: Record<string, unknown> = {};
      const trimmed = nickname.trim();
      // 若與目前顯示名稱不同才送
      if (trimmed !== me?.name || trimmed === '') {
        patchBody.nickname = trimmed || null;
      }
      if (newAvatarUrl) patchBody.avatarUrl = newAvatarUrl;

      if (Object.keys(patchBody).length > 0) {
        const res = await fetch('/api/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patchBody),
        });
        if (!res.ok) {
          const err = await res.json() as { error?: string };
          throw new Error(err.error ?? '儲存失敗');
        }
      }

      setMessage({ type: 'ok', text: '已儲存！' });
      setAvatarFile(null);
      await fetchMe();
    } catch (e) {
      setMessage({ type: 'err', text: e instanceof Error ? e.message : '儲存失敗' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetAvatar = async () => {
    if (!confirm('確定要移除自訂頭貼，恢復 Google 頭貼？')) return;
    setSaving(true);
    await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarUrl: me?.avatar?.startsWith('https://') ? me.avatar : null }),
    });
    setAvatarPreview(null);
    setAvatarFile(null);
    await fetchMe();
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: '2px solid var(--accent-blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (!me) {
    return (
      <div style={{ maxWidth: 480, margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>請先登入才能查看個人設定。</p>
      </div>
    );
  }

  const currentAvatar = avatarPreview ?? me.avatar;
  const letter = (me.displayName?.[0] ?? '?').toUpperCase();
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
  const letterColor = colors[letter.charCodeAt(0) % colors.length];

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* 返回 */}
      <button
        onClick={() => router.back()}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '2rem' }}
      >
        <ArrowLeft size={15} /> 返回
      </button>

      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2rem' }}>個人設定</h1>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* 頭貼 */}
        <div>
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 600 }}>頭貼</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* 預覽 */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt="頭貼"
                  width={80} height={80}
                  style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', display: 'block' }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: letterColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 32 }}>
                  {letter}
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'var(--accent-blue)', border: '2px solid var(--bg-card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#fff',
                }}
                title="更換頭貼"
              >
                <Camera size={12} />
              </button>
            </div>

            <div style={{ flex: 1 }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => void handleFileChange(e)} />
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  padding: '0.45rem 1rem', borderRadius: 8,
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer',
                  display: 'block', marginBottom: '0.5rem', width: '100%',
                }}
              >
                選擇圖片
              </button>
              {me.avatar && !me.avatar.startsWith('https://') && (
                <button
                  onClick={() => void handleResetAvatar()}
                  style={{
                    padding: '0.35rem 1rem', borderRadius: 8,
                    background: 'none', border: '1px solid rgba(239,68,68,0.3)',
                    color: '#f87171', fontSize: '0.8rem', cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  移除自訂頭貼
                </button>
              )}
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                圖片會自動裁切為正方形，最大 256×256
              </p>
            </div>
          </div>
          {avatarFile && (
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--accent-blue-light)', fontSize: '0.8rem' }}>✓ 已選擇新頭貼（儲存後生效）</span>
              <button onClick={() => { setAvatarFile(null); setAvatarPreview(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* 暱稱 */}
        <div>
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>
            暱稱 <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>（最多 30 字）</span>
          </label>
          <input
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            maxLength={30}
            placeholder={`留空則顯示 Google 名稱（${me.displayName}）`}
            style={{
              width: '100%', padding: '10px 12px',
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.95rem',
              outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent-blue)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.4rem' }}>
            暱稱用於留言顯示，可以保護隱私。
          </p>
        </div>

        {/* Google 帳號資訊（唯讀） */}
        <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.25rem' }}>Google 帳號（唯讀）</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{me.displayName}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.5rem' }}>
            加入時間：{new Date(me.createdAt).toLocaleDateString('zh-TW')}
          </p>
        </div>

        {/* 訊息 */}
        {message && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1rem', borderRadius: 8,
            background: message.type === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${message.type === 'ok' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: message.type === 'ok' ? '#4ade80' : '#f87171',
            fontSize: '0.88rem',
          }}>
            {message.type === 'ok' ? <Check size={15} /> : <X size={15} />}
            {message.text}
          </div>
        )}

        {/* 儲存按鈕 */}
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          style={{
            padding: '0.65rem', borderRadius: 8,
            background: 'var(--accent-blue)', border: 'none',
            color: '#fff', fontWeight: 600, fontSize: '0.95rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1, transition: 'opacity 0.15s',
          }}
        >
          {saving ? '儲存中...' : '儲存設定'}
        </button>
      </div>
    </div>
  );
}
