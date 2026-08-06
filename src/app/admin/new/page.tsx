'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Newspaper, FolderKanban, Map } from 'lucide-react';
import PostForm from '@/components/admin/PostForm';

type PostType = 'blog' | 'portfolio' | 'minecraft';

const types: { id: PostType; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  { id: 'blog', label: '部落格', desc: '用 Markdown 撰寫文章', icon: <Newspaper size={24} />, color: 'border-purple-700 bg-purple-900/20 text-purple-400' },
  { id: 'portfolio', label: '作品集', desc: '展示遊戲、工具等作品', icon: <FolderKanban size={24} />, color: 'border-blue-700 bg-blue-900/20 text-blue-400' },
  { id: 'minecraft', label: 'MC 地圖', desc: '提供地圖下載', icon: <Map size={24} />, color: 'border-green-700 bg-green-900/20 text-green-400' },
];

export default function NewPostPage() {
  const searchParams = useSearchParams();
  const preType = searchParams.get('type') as PostType | null;
  const [selected, setSelected] = useState<PostType | null>(preType);

  if (!selected) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">新增貼文</h1>
        <p className="text-gray-400 text-sm mb-8">選擇貼文類型（建立後無法更改）</p>
        <div className="grid grid-cols-3 gap-4 max-w-2xl">
          {types.map(t => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              className={`border-2 rounded-2xl p-6 flex flex-col items-center gap-3 transition-all hover:scale-105 ${t.color}`}
            >
              {t.icon}
              <div className="text-center">
                <p className="font-semibold text-white">{t.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const meta = types.find(t => t.id === selected)!;

  return (
    <div className="max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <span className={`p-2 rounded-xl border ${meta.color}`}>{meta.icon}</span>
        <div>
          <h1 className="text-xl font-bold text-white">新增{meta.label}</h1>
          <button onClick={() => setSelected(null)} className="text-xs text-gray-500 hover:text-gray-300">
            ← 選擇其他類型
          </button>
        </div>
      </div>
      <PostForm postType={selected} />
    </div>
  );
}
