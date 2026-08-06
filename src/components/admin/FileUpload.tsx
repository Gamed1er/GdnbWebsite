'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileArchive } from 'lucide-react';

interface Props {
  value: string;
  onChange: (path: string, size?: number) => void;
  uploadType: 'map' | 'resourcepack';
  label?: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function FileUpload({ value, onChange, uploadType, label }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`/api/admin/upload?type=${uploadType}`, { method: 'POST', body: fd });
    const data = await res.json() as { path?: string; size?: number };
    if (data.path) {
      setFileSize(data.size ?? null);
      onChange(data.path, data.size);
    }
    setUploading(false);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await upload(file);
  };

  const filename = value ? value.split('/').pop() : null;

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
          <FileArchive size={20} className="text-green-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{filename}</p>
            {fileSize && <p className="text-xs text-gray-500">{formatBytes(fileSize)}</p>}
          </div>
          <button type="button" onClick={() => { onChange(''); setFileSize(null); }} className="text-gray-500 hover:text-red-400">
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
            dragOver ? 'border-blue-500 bg-blue-950/20' : 'border-gray-700 hover:border-gray-500'
          }`}
        >
          {uploading ? (
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Upload size={20} className="text-gray-500" />
              <p className="text-sm text-gray-400">{label ?? '上傳 .zip 檔案'}</p>
              <p className="text-xs text-gray-600">拖放或點擊選擇</p>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".zip,.rar,.7z"
        className="hidden"
        onChange={async e => {
          const file = e.target.files?.[0];
          if (file) await upload(file);
        }}
      />
    </div>
  );
}
