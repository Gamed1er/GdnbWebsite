'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, X, ClipboardPaste } from 'lucide-react';

interface Props {
  value: string;
  onChange: (path: string) => void;
}

export default function ImageUpload({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/upload?type=image', { method: 'POST', body: fd });
    const data = await res.json() as { path?: string };
    if (data.path) onChange(data.path);
    setUploading(false);
  }, [onChange]);

  // Ctrl+V paste support
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) { void upload(file); break; }
        }
      }
    };
    document.addEventListener('paste', handler);
    return () => document.removeEventListener('paste', handler);
  }, [upload]);

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await upload(file);
  };

  return (
    <div>
      {value ? (
        <div className="relative group">
          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="封面" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1.5 bg-gray-900/80 rounded-full text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={16} />
          </button>
          <p className="mt-1 text-xs text-gray-500 truncate">{value}</p>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
            dragOver ? 'border-blue-500 bg-blue-950/20' : 'border-gray-700 hover:border-gray-500'
          }`}
        >
          {uploading ? (
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Upload size={24} className="text-gray-500" />
              <div className="text-center">
                <p className="text-sm text-gray-400">拖放圖片、點擊上傳</p>
                <p className="text-xs text-gray-600 mt-1 flex items-center gap-1 justify-center">
                  <ClipboardPaste size={12} />Ctrl+V 貼上剪貼板圖片
                </p>
              </div>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async e => {
          const file = e.target.files?.[0];
          if (file) await upload(file);
        }}
      />
    </div>
  );
}
