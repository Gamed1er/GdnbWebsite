'use client';

import { useEffect, useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';

interface Settings {
  youtube_channel_id: string;
  site_title: string;
  site_description: string;
}

const DEFAULT: Settings = {
  youtube_channel_id: '',
  site_title: '遊戲亡',
  site_description: '',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then((d: Partial<Settings>) => {
        setSettings({ ...DEFAULT, ...d });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleYouTubeSync = async () => {
    setSyncing(true);
    const res = await fetch('/api/youtube/sync', { method: 'POST' });
    const data = await res.json() as { synced?: number; error?: string };
    setSyncing(false);
    if (data.synced !== undefined) {
      alert(`同步完成！已同步 ${data.synced} 部影片`);
    } else {
      alert('同步失敗：' + (data.error ?? '未知錯誤'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-white mb-8">設定</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Site */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">網站資訊</h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">網站名稱</label>
            <input
              type="text"
              value={settings.site_title}
              onChange={e => setSettings(s => ({ ...s, site_title: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">網站描述</label>
            <textarea
              value={settings.site_description}
              onChange={e => setSettings(s => ({ ...s, site_description: e.target.value }))}
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </section>

        {/* YouTube */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-red-400 text-sm">▶</span>
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">YouTube 設定</h2>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">頻道 ID</label>
            <input
              type="text"
              value={settings.youtube_channel_id}
              onChange={e => setSettings(s => ({ ...s, youtube_channel_id: e.target.value }))}
              placeholder="UCxxxxxxxx..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
            />
            <p className="text-xs text-gray-600 mt-1.5">
              在 YouTube Studio → 自訂 → 基本資訊 → 頻道網址 可找到
            </p>
          </div>
          <button
            type="button"
            onClick={handleYouTubeSync}
            disabled={syncing || !settings.youtube_channel_id}
            className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 disabled:bg-gray-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? '同步中...' : '立即同步影片'}
          </button>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Save size={15} />
          {saving ? '儲存中...' : saved ? '✓ 已儲存' : '儲存設定'}
        </button>
      </form>
    </div>
  );
}
