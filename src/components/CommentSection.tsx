'use client';

import { useEffect, useState, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageSquare, Trash2, Flag, CornerDownRight, X, LogIn } from 'lucide-react';

interface Author { name: string; avatar: string | null }
interface Comment {
  id: number;
  content: string | null;
  isDeleted: boolean;
  deletedBy: string | null;
  parentId: number | null;
  userId: number;
  author: Author;
  createdAt: string;
  replies?: Comment[];
}
interface Me {
  role: 'admin' | 'user';
  id?: number;
  name: string;
  avatar?: string | null;
}

interface Props {
  postType: 'blog' | 'portfolio' | 'minecraft';
  postId: number;
}

function Avatar({ src, name, size = 32 }: { src?: string | null; name: string; size?: number }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} width={size} height={size}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(255,255,255,0.15)', display: 'block' }}
      referrerPolicy="no-referrer" />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, color: 'white', fontWeight: 700,
      border: '2px solid rgba(255,255,255,0.15)',
    }}>
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function CommentInput({
  onSubmit, onCancel, placeholder = '留言（支援 Markdown，最多 1024 字）', isReply = false,
}: {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  isReply?: boolean;
}) {
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(content);
      setContent('');
      setPreview(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : '送出失敗');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
        {['編輯', '預覽'].map(tab => (
          <button key={tab} type="button"
            onClick={() => setPreview(tab === '預覽')}
            style={{
              fontSize: '0.8rem', padding: '2px 10px', borderRadius: '6px',
              background: (tab === '預覽') === preview ? 'var(--accent-blue)' : 'transparent',
              color: (tab === '預覽') === preview ? 'white' : 'var(--text-muted)',
              border: 'none', cursor: 'pointer',
            }}>
            {tab}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: content.length > 900 ? '#f59e0b' : 'var(--text-muted)' }}>
          {content.length} / 1024
        </span>
      </div>

      {preview ? (
        <div className="markdown-body" style={{
          minHeight: isReply ? '60px' : '100px', padding: '0.75rem',
          background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)',
          fontSize: '0.875rem',
        }}>
          {content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            : <p style={{ color: 'var(--text-muted)' }}>預覽</p>}
        </div>
      ) : (
        <textarea
          value={content}
          onChange={e => setContent(e.target.value.slice(0, 1024))}
          placeholder={placeholder}
          rows={isReply ? 3 : 5}
          style={{
            width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '0.75rem', color: 'var(--text-primary)',
            fontSize: '0.875rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent-blue)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
      )}

      {error && <p style={{ color: '#f87171', fontSize: '0.8rem' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        {onCancel && (
          <button onClick={onCancel} type="button" style={{
            padding: '6px 14px', borderRadius: '6px', fontSize: '0.85rem',
            background: 'var(--bg-secondary)', color: 'var(--text-muted)',
            border: '1px solid var(--border)', cursor: 'pointer',
          }}>取消</button>
        )}
        <button onClick={handleSubmit} disabled={submitting || !content.trim()} type="button" style={{
          padding: '6px 16px', borderRadius: '6px', fontSize: '0.85rem',
          background: 'var(--accent-blue)', color: 'white', border: 'none',
          cursor: submitting || !content.trim() ? 'not-allowed' : 'pointer',
          opacity: submitting || !content.trim() ? 0.6 : 1,
        }}>
          {submitting ? '送出中...' : '送出'}
        </button>
      </div>
    </div>
  );
}

function CommentCard({
  comment, me, postType, postId, onDeleted, onReported, depth = 0,
}: {
  comment: Comment; me: Me | null;
  postType: string; postId: number;
  onDeleted: (id: number) => void;
  onReported: (id: number) => void;
  depth?: number;
}) {
  const [replying, setReplying] = useState(false);
  const [replies, setReplies] = useState(comment.replies ?? []);
  const [reportReason, setReportReason] = useState('');
  const [showReport, setShowReport] = useState(false);

  const canDelete = me && (me.role === 'admin' || me.id === comment.userId);

  const handleDelete = async () => {
    if (!confirm('確定刪除這則留言？')) return;
    const res = await fetch(`/api/comments/${comment.id}`, { method: 'DELETE' });
    if (res.ok) onDeleted(comment.id);
  };

  const handleReport = async () => {
    const res = await fetch(`/api/comments/${comment.id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reportReason }),
    });
    const data = await res.json() as { error?: string };
    if (res.ok) { onReported(comment.id); setShowReport(false); }
    else alert(data.error ?? '檢舉失敗');
  };

  const handleReply = async (content: string) => {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_type: postType, post_id: postId, content, parent_id: comment.id }),
    });
    const data = await res.json() as { error?: string; id?: number };
    if (!res.ok) throw new Error(data.error ?? '送出失敗');
    // 重新載入回覆
    const updated = await fetch(`/api/comments?post_type=${postType}&post_id=${postId}`).then(r => r.json()) as Comment[];
    const parent = updated.find(c => c.id === comment.id);
    if (parent) setReplies(parent.replies ?? []);
    setReplying(false);
  };

  const timeStr = new Date(comment.createdAt).toLocaleDateString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div style={{ marginLeft: depth > 0 ? '2.5rem' : 0 }}>
      <div style={{
        display: 'flex', gap: '0.75rem', padding: '0.875rem 0',
        borderTop: '1px solid var(--border)',
      }}>
        <Avatar src={comment.author.avatar} name={comment.author.name} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              {comment.author.name}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeStr}</span>
          </div>

          {comment.isDeleted ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
              {comment.deletedBy === 'admin' ? '（此留言已被管理員刪除）' : '（留言已刪除）'}
            </p>
          ) : (
            <div className="markdown-body" style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.content ?? ''}</ReactMarkdown>
            </div>
          )}

          {/* Action buttons */}
          {!comment.isDeleted && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              {me && depth === 0 && (
                <button onClick={() => setReplying(r => !r)} style={actionBtnStyle}>
                  <CornerDownRight size={13} /> 回覆
                </button>
              )}
              {canDelete && (
                <button onClick={handleDelete} style={{ ...actionBtnStyle, color: '#f87171' }}>
                  <Trash2 size={13} /> 刪除
                </button>
              )}
              {me && me.role !== 'admin' && me.id !== comment.userId && (
                <button onClick={() => setShowReport(r => !r)} style={actionBtnStyle}>
                  <Flag size={13} /> 檢舉
                </button>
              )}
            </div>
          )}

          {/* Report input */}
          {showReport && (
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                placeholder="檢舉原因（選填）"
                style={{
                  flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '6px', padding: '4px 10px', color: 'var(--text-primary)', fontSize: '0.8rem',
                }}
              />
              <button onClick={handleReport} style={{ ...actionBtnStyle, color: '#f87171' }}>送出</button>
              <button onClick={() => setShowReport(false)} style={actionBtnStyle}><X size={13} /></button>
            </div>
          )}

          {/* Reply input */}
          {replying && (
            <div style={{ marginTop: '0.75rem' }}>
              <CommentInput onSubmit={handleReply} onCancel={() => setReplying(false)} isReply placeholder="回覆（支援 Markdown，最多 1024 字）" />
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {replies.map(reply => (
        <CommentCard key={reply.id} comment={reply} me={me}
          postType={postType} postId={postId}
          onDeleted={onDeleted} onReported={onReported} depth={1} />
      ))}
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '3px',
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--text-muted)', fontSize: '0.78rem', padding: '2px 4px', borderRadius: '4px',
};

export default function CommentSection({ postType, postId }: Props) {
  const [me, setMe] = useState<Me | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reported, setReported] = useState<Set<number>>(new Set());

  const fetchComments = useCallback(async () => {
    const data = await fetch(`/api/comments?post_type=${postType}&post_id=${postId}`).then(r => r.json()) as Comment[];
    setComments(data);
    setLoading(false);
  }, [postType, postId]);

  useEffect(() => {
    // 取使用者資訊（觸發通知紅點更新）
    fetch('/api/me').then(r => r.json()).then((data: Me | null) => setMe(data));
    void fetchComments();
  }, [fetchComments]);

  const handleNew = async (content: string) => {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_type: postType, post_id: postId, content }),
    });
    const data = await res.json() as { error?: string };
    if (!res.ok) throw new Error(data.error ?? '送出失敗');
    await fetchComments();
  };

  const handleDeleted = (id: number) => {
    setComments(prev => prev.map(c => {
      if (c.id === id) return { ...c, isDeleted: true, content: null };
      return { ...c, replies: c.replies?.map(r => r.id === id ? { ...r, isDeleted: true, content: null } : r) };
    }));
  };

  const handleReported = (id: number) => {
    setReported(prev => new Set([...prev, id]));
    alert('已送出檢舉，感謝你的回報！');
  };

  const totalCount = comments.reduce((a, c) => a + 1 + (c.replies?.length ?? 0), 0);

  return (
    <section style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <MessageSquare size={20} /> 留言 {totalCount > 0 && <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>({totalCount})</span>}
      </h2>

      {/* 新留言輸入區 */}
      {me && me.role !== 'admin' ? (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Avatar src={me.avatar} name={me.name} size={36} />
          <div style={{ flex: 1 }}>
            <CommentInput onSubmit={handleNew} />
          </div>
        </div>
      ) : !me ? (
        <div style={{
          padding: '1.25rem', background: 'var(--bg-card)', borderRadius: '10px',
          border: '1px solid var(--border)', textAlign: 'center', marginBottom: '1.5rem',
        }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
            登入後即可留言
          </p>
          <button onClick={() => signIn('google', { callbackUrl: window.location.href })} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '8px 20px', background: 'white', color: '#374151',
            borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem',
            border: '1px solid #e5e7eb', cursor: 'pointer',
          }}>
            <LogIn size={16} /> 用 Google 帳號登入
          </button>
        </div>
      ) : null}

      {/* 留言列表 */}
      {loading ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>載入中...</div>
      ) : comments.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0', fontSize: '0.9rem' }}>
          還沒有留言，來當第一個吧！
        </p>
      ) : (
        <div>
          {comments.map(c => (
            <CommentCard key={c.id} comment={c} me={me}
              postType={postType} postId={postId}
              onDeleted={handleDeleted}
              onReported={reported.has(c.id) ? () => {} : handleReported} />
          ))}
        </div>
      )}
    </section>
  );
}
