'use client';

import { useEffect, useState } from 'react';
import { Eye, Heart, Download } from 'lucide-react';

interface DayData { date: string; count: number }

interface StatsData {
  views: DayData[];
  downloads?: DayData[];
  total: { views: number; likes: number; downloads: number };
}

interface Props {
  type: string;
  id: number;
}

function MiniLineChart({ data, color }: { data: DayData[]; color: string }) {
  if (data.length === 0) {
    return <div className="h-20 flex items-center justify-center text-gray-600 text-xs">暫無資料</div>;
  }

  // Fill last 30 days
  const days: DayData[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const found = data.find(x => x.date === key);
    days.push({ date: key, count: found?.count ?? 0 });
  }

  const max = Math.max(...days.map(d => d.count), 1);
  const W = 600, H = 80, PAD = 4;
  const stepX = (W - PAD * 2) / (days.length - 1);

  const points = days.map((d, i) => ({
    x: PAD + i * stepX,
    y: PAD + (H - PAD * 2) * (1 - d.count / max),
    count: d.count,
    date: d.date,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#g-${color})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" />
      {points.filter(p => p.count > 0).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
      ))}
    </svg>
  );
}

export default function StatsChart({ type, id }: Props) {
  const [data, setData] = useState<StatsData | null>(null);

  useEffect(() => {
    fetch(`/api/admin/stats/${type}/${id}`)
      .then(r => r.json())
      .then((d: StatsData) => setData(d))
      .catch(() => {});
  }, [type, id]);

  if (!data) return (
    <div className="h-32 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <Eye size={14} className="text-blue-400" />
          <span className="text-white font-medium">{data.total.views.toLocaleString()}</span> 次觀看
        </div>
        {type !== 'minecraft' && (
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <Heart size={14} className="text-red-400" />
            <span className="text-white font-medium">{data.total.likes.toLocaleString()}</span> 個喜歡
          </div>
        )}
        {type === 'minecraft' && (
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <Download size={14} className="text-green-400" />
            <span className="text-white font-medium">{data.total.downloads.toLocaleString()}</span> 次下載
          </div>
        )}
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2">過去 30 天觀看</p>
        <MiniLineChart data={data.views} color="#3b82f6" />
      </div>

      {data.downloads && (
        <div>
          <p className="text-xs text-gray-500 mb-2">過去 30 天下載</p>
          <MiniLineChart data={data.downloads} color="#22c55e" />
        </div>
      )}
    </div>
  );
}
