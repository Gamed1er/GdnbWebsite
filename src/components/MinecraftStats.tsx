'use client';

import { useEffect, useState } from 'react';
import { Eye, Download } from 'lucide-react';

interface Props {
  mapId: number;
  initialViews: number;
  downloads: number;
}

export default function MinecraftStats({ mapId, initialViews, downloads }: Props) {
  const [views, setViews] = useState(initialViews);

  useEffect(() => {
    fetch(`/api/minecraft/${mapId}/view`, { method: 'POST' })
      .then(r => r.json())
      .then((d: { views: number }) => setViews(d.views));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId]);

  return (
    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <Eye size={13} /> {views.toLocaleString()} 次觀看
      </span>
      <span style={{ color: 'var(--border)' }}>·</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <Download size={13} /> {downloads.toLocaleString()} 次下載
      </span>
    </p>
  );
}
