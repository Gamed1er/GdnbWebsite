'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Newspaper, FolderKanban, Map } from 'lucide-react';
import PostForm from '@/components/admin/PostForm';
import StatsChart from '@/components/admin/StatsChart';

type PostType = 'blog' | 'portfolio' | 'minecraft';

const typeLabel: Record<PostType, { label: string; icon: React.ReactNode; color: string }> = {
  blog: { label: '部落格', icon: <Newspaper size={18} />, color: 'border-purple-700 bg-purple-900/20 text-purple-400' },
  portfolio: { label: '作品集', icon: <FolderKanban size={18} />, color: 'border-blue-700 bg-blue-900/20 text-blue-400' },
  minecraft: { label: 'MC 地圖', icon: <Map size={18} />, color: 'border-green-700 bg-green-900/20 text-green-400' },
};

export default function EditPostPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/${type}/${id}`)
      .then(r => r.json())
      .then((d: Record<string, unknown>) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [type, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-gray-400">找不到貼文</div>;
  }

  const meta = typeLabel[type as PostType];

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <span className={`p-2 rounded-xl border ${meta.color}`}>{meta.icon}</span>
        <h1 className="text-xl font-bold text-white">編輯{meta.label}</h1>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
          <PostForm
            postType={type as PostType}
            initialData={{ ...data as Parameters<typeof PostForm>[0]['initialData'], id: Number(id) }}
            isEdit
          />
        </div>
        <div className="col-span-1">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sticky top-8">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">數據統計</h2>
            <StatsChart type={type} id={Number(id)} />
          </div>
        </div>
      </div>
    </div>
  );
}
