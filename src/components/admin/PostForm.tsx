'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import TagManager from './TagManager';
import ImageUpload from './ImageUpload';
import FileUpload from './FileUpload';

type PostType = 'blog' | 'portfolio' | 'minecraft';

interface ExtraLink { label: string; url: string }

interface FormState {
  title: string;
  description: string;
  content: string;
  cover_image: string;
  tags: string[];
  published: boolean;
  // Blog
  // Portfolio
  github_url: string;
  extra_links: ExtraLink[];
  // Minecraft
  file_path: string;
  file_size: number;
  resourcepack_path: string;
  resourcepack_size: number;
  version: string;
}

interface Props {
  postType: PostType;
  initialData?: Partial<FormState> & { id?: number };
  isEdit?: boolean;
}

const typeLabel: Record<PostType, string> = {
  blog: '部落格',
  portfolio: '作品集',
  minecraft: 'Minecraft 地圖',
};

export default function PostForm({ postType, initialData, isEdit }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    content: '',
    cover_image: '',
    tags: [],
    published: true,
    github_url: '',
    extra_links: [],
    file_path: '',
    file_size: 0,
    resourcepack_path: '',
    resourcepack_size: 0,
    version: '',
    ...initialData,
  });

  const set = (key: keyof FormState, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const addExtraLink = () => set('extra_links', [...form.extra_links, { label: '', url: '' }]);
  const updateExtraLink = (i: number, field: 'label' | 'url', val: string) => {
    const links = [...form.extra_links];
    links[i] = { ...links[i], [field]: val };
    set('extra_links', links);
  };
  const removeExtraLink = (i: number) => set('extra_links', form.extra_links.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('請填寫標題'); return; }
    if (postType === 'minecraft' && !form.file_path) { setError('請上傳地圖檔案'); return; }

    setSaving(true);
    setError('');

    const payload = {
      ...form,
      extra_links: postType === 'portfolio' ? form.extra_links.filter(l => l.url) : undefined,
    };

    const url = isEdit
      ? `/api/admin/${postType}/${initialData!.id}`
      : `/api/admin/${postType}`;

    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push('/admin');
    } else {
      const d = await res.json() as { error?: string };
      setError(d.error ?? '儲存失敗');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">標題 *</label>
        <input
          type="text"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder={`${typeLabel[postType]}標題`}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {postType === 'blog' ? '摘要（選填）' : '描述'}
        </label>
        <textarea
          value={form.description}
          onChange={e => { set('description', e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
          rows={postType === 'blog' ? 3 : 12}
          placeholder={postType === 'blog' ? '簡短描述' : '支援 Markdown，詳細說明內容...'}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm resize-none overflow-hidden"
        />
      </div>

      {/* Blog content (Markdown) */}
      {postType === 'blog' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">內容（Markdown）</label>
          <textarea
            value={form.content}
            onChange={e => { set('content', e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
            rows={18}
            placeholder="# 標題&#10;&#10;在這裡用 Markdown 撰寫文章..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm resize-none overflow-hidden font-mono"
          />
        </div>
      )}

      {/* Cover image */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">封面圖片</label>
        <ImageUpload value={form.cover_image} onChange={v => set('cover_image', v)} />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">標籤</label>
        <TagManager value={form.tags} onChange={v => set('tags', v)} />
      </div>

      {/* Portfolio links */}
      {postType === 'portfolio' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">GitHub 連結</label>
            <input
              type="url"
              value={form.github_url}
              onChange={e => set('github_url', e.target.value)}
              placeholder="https://github.com/..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">額外連結（itch.io、Demo 等）</label>
              <button
                type="button"
                onClick={addExtraLink}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
              >
                <Plus size={14} />新增連結
              </button>
            </div>
            <div className="space-y-2">
              {form.extra_links.map((link, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={link.label}
                    onChange={e => updateExtraLink(i, 'label', e.target.value)}
                    placeholder="名稱（如 itch.io）"
                    className="w-32 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={e => updateExtraLink(i, 'url', e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                  {link.url && (
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-blue-400">
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <button type="button" onClick={() => removeExtraLink(i)} className="p-2 text-gray-500 hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {form.extra_links.length === 0 && (
                <p className="text-xs text-gray-600">尚無額外連結</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Minecraft files */}
      {postType === 'minecraft' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">地圖版本</label>
            <input
              type="text"
              value={form.version}
              onChange={e => set('version', e.target.value)}
              placeholder="1.21.1"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">地圖檔案 *</label>
            <FileUpload
              value={form.file_path}
              onChange={(path, size) => { set('file_path', path); set('file_size', size ?? 0); }}
              uploadType="map"
              label="上傳地圖 .zip 檔"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">資源包（選填）</label>
            <FileUpload
              value={form.resourcepack_path}
              onChange={(path, size) => { set('resourcepack_path', path); set('resourcepack_size', size ?? 0); }}
              uploadType="resourcepack"
              label="上傳資源包 .zip 檔"
            />
          </div>
        </div>
      )}

      {/* Published toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => set('published', !form.published)}
          className={`relative w-11 h-6 rounded-full transition-colors ${!form.published ? 'bg-yellow-600' : 'bg-gray-700'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${!form.published ? 'translate-x-5' : ''}`} />
        </button>
        <span className="text-sm text-gray-300">
          {form.published ? '已發佈（公開可見）' : '草稿（不公開）'}
        </span>
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          {saving ? (
            <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />儲存中...</>
          ) : (isEdit ? '儲存變更' : '發布')}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  );
}
