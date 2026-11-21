'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { markdownComponents } from '@/components/markdownComponents';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
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
  datapack_path: string;
  datapack_size: number;
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
    datapack_path: '',
    datapack_size: 0,
    resourcepack_path: '',
    resourcepack_size: 0,
    version: '',
    ...initialData,
  });

  const set = (key: keyof FormState, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const descRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    const scrollY = window.scrollY;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
    window.scrollTo({ top: scrollY, behavior: 'instant' } as ScrollToOptions);
  }, []);

  // 編輯模式：載入時根據已有內容設定初始高度
  useEffect(() => {
    autoResize(descRef.current);
    autoResize(contentRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 在游標位置插入圖片 HTML
  const insertImage = useCallback((
    imgPath: string,
    field: 'description' | 'content',
    ref: React.RefObject<HTMLTextAreaElement | null>
  ) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const md = `<img src="${imgPath}" width="100%">`;
    const newVal = el.value.slice(0, start) + md + el.value.slice(end);
    set(field, newVal);
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = start + md.length;
      autoResize(el);
    }, 0);
  }, [autoResize, set]);

  // 上傳圖片檔（png/jpg/gif…）並插入
  const uploadAndInsert = useCallback(async (
    file: File,
    field: 'description' | 'content',
    ref: React.RefObject<HTMLTextAreaElement | null>
  ) => {
    // 剪貼簿的檔名常是 image.png，依實際 MIME 補上正確副檔名，GIF 才不會被存成 .png
    const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg');
    const named = ext && !file.name.toLowerCase().endsWith(`.${ext}`)
      ? new File([file], `image.${ext}`, { type: file.type })
      : file;
    const fd = new FormData();
    fd.append('file', named);
    const res = await fetch('/api/admin/upload?type=image', { method: 'POST', body: fd });
    const data = await res.json() as { path?: string };
    if (!data.path) { setError('圖片上傳失敗'); return; }
    insertImage(data.path, field, ref);
  }, [insertImage]);

  // 從網址下載 GIF（伺服器端抓取，避開 CORS）並插入
  const insertFromUrl = useCallback(async (
    url: string,
    field: 'description' | 'content',
    ref: React.RefObject<HTMLTextAreaElement | null>
  ) => {
    const res = await fetch('/api/admin/upload/from-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await res.json() as { path?: string; error?: string };
    if (!data.path) { setError(data.error ?? 'GIF 下載失敗'); return false; }
    insertImage(data.path, field, ref);
    return true;
  }, [insertImage]);

  // 圖片貼上上傳並插入 Markdown 引用
  const handleImagePaste = useCallback(async (
    e: React.ClipboardEvent<HTMLTextAreaElement>,
    field: 'description' | 'content',
    ref: React.RefObject<HTMLTextAreaElement | null>
  ) => {
    const cd = e.clipboardData;
    if (!cd) return;
    const files = Array.from(cd.items)
      .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter((f): f is File => !!f);

    // 1. 剪貼簿裡有真正的 GIF 檔（例如從檔案總管複製）
    const gifFile = files.find(f => f.type === 'image/gif');
    if (gifFile) {
      e.preventDefault();
      await uploadAndInsert(gifFile, field, ref);
      return;
    }

    // 2. 從網頁「複製圖片」時，瀏覽器只給靜態 PNG，改從 HTML / 文字裡找 GIF 原始網址
    const isGifUrl = (s: string) => {
      try { return /\.gif$/i.test(new URL(s).pathname); } catch { return false; }
    };
    const html = cd.getData('text/html');
    const htmlSrc = html ? new DOMParser().parseFromString(html, 'text/html').querySelector('img')?.getAttribute('src') : null;
    const text = cd.getData('text/plain').trim();
    const gifUrl = htmlSrc && isGifUrl(htmlSrc) ? htmlSrc : isGifUrl(text) ? text : null;
    if (gifUrl) {
      e.preventDefault();
      const ok = await insertFromUrl(gifUrl, field, ref);
      // 原網址抓不到時，退回用剪貼簿裡的靜態圖
      if (!ok && files[0]) await uploadAndInsert(files[0], field, ref);
      return;
    }

    // 3. 一般圖片（png/jpg 截圖等）
    if (files[0]) {
      e.preventDefault();
      await uploadAndInsert(files[0], field, ref);
    }
  }, [uploadAndInsert, insertFromUrl]);

  // 拖曳圖片檔到文字框
  const handleImageDrop = useCallback(async (
    e: React.DragEvent<HTMLTextAreaElement>,
    field: 'description' | 'content',
    ref: React.RefObject<HTMLTextAreaElement | null>
  ) => {
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;
    e.preventDefault();
    for (const f of files) await uploadAndInsert(f, field, ref);
  }, [uploadAndInsert]);

  // 「插入圖片 / GIF」按鈕用的隱藏檔案選擇器
  const pickerTarget = useRef<'description' | 'content'>('description');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const openImagePicker = (field: 'description' | 'content') => {
    pickerTarget.current = field;
    fileInputRef.current?.click();
  };
  const handlePickedFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const field = pickerTarget.current;
    const ref = field === 'content' ? contentRef : descRef;
    for (const f of Array.from(e.target.files ?? [])) await uploadAndInsert(f, field, ref);
    e.target.value = '';
  };

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
    if (postType === 'minecraft' && !form.file_path && !form.datapack_path && !form.resourcepack_path) { setError('請至少上傳一個檔案（地圖、資料包或資源包）'); return; }

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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        multiple
        hidden
        onChange={e => { void handlePickedFiles(e); }}
      />
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
          {postType !== 'blog' && <span className="text-gray-500 font-normal ml-2 text-xs">支援 Markdown，Ctrl+V 或拖曳可貼上圖片 / GIF</span>}
          {postType !== 'blog' && (
            <button type="button" onClick={() => openImagePicker('description')} className="ml-2 text-xs text-blue-400 hover:text-blue-300">
              插入圖片 / GIF
            </button>
          )}
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: postType === 'blog' ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
          <textarea
            ref={descRef}
            value={form.description}
            onChange={e => { set('description', e.target.value); autoResize(e.target); }}
            onPaste={e => { void handleImagePaste(e, 'description', descRef); }}
            onDrop={e => { void handleImageDrop(e, 'description', descRef); }}
            rows={postType === 'blog' ? 3 : 12}
            placeholder={postType === 'blog' ? '簡短描述' : '# 標題\n\n在這裡用 Markdown 撰寫描述...'}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm resize-none overflow-hidden"
          />
          {postType !== 'blog' && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 overflow-auto text-sm" style={{ minHeight: '12lh' }}>
              {form.description ? (
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>{form.description}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-gray-600">預覽</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Blog content (Markdown) */}
      {postType === 'blog' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            內容（Markdown）
            <span className="text-gray-500 font-normal ml-2 text-xs">Ctrl+V 或拖曳可貼上圖片 / GIF</span>
            <button type="button" onClick={() => openImagePicker('content')} className="ml-2 text-xs text-blue-400 hover:text-blue-300">
              插入圖片 / GIF
            </button>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <textarea
              ref={contentRef}
              value={form.content}
              onChange={e => { set('content', e.target.value); autoResize(e.target); }}
              onPaste={e => { void handleImagePaste(e, 'content', contentRef); }}
              onDrop={e => { void handleImageDrop(e, 'content', contentRef); }}
              rows={18}
              placeholder="# 標題&#10;&#10;在這裡用 Markdown 撰寫文章..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm resize-none overflow-hidden font-mono"
            />
            <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 overflow-auto text-sm" style={{ minHeight: '18lh' }}>
              {form.content ? (
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>{form.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-gray-600">預覽</p>
              )}
            </div>
          </div>
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
          <p className="text-xs text-gray-500 -mt-1">至少上傳以下其中一個檔案</p>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">地圖（選填）</label>
            <FileUpload
              value={form.file_path}
              onChange={(path, size) => { set('file_path', path); set('file_size', size ?? 0); }}
              uploadType="map"
              label="上傳地圖 .zip 檔"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">資料包（選填）</label>
            <FileUpload
              value={form.datapack_path}
              onChange={(path, size) => { set('datapack_path', path); set('datapack_size', size ?? 0); }}
              uploadType="map"
              label="上傳資料包 .zip 檔"
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
