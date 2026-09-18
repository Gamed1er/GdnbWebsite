'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { UploadCloud, Download, RotateCcw, Loader2, AlertTriangle } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { ui } from '@/lib/i18n';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB
const TOOL_SLUG = 'image-background-removal';

type Status = 'idle' | 'loading' | 'processing' | 'done' | 'error';
type Quality = 'small' | 'medium' | 'large';

const QUALITY_TO_MODEL = {
  small: 'isnet_quint8',
  medium: 'isnet_fp16',
  large: 'isnet',
} as const;

function detectDevice(): 'cpu' | 'gpu' {
  return typeof navigator !== 'undefined' && 'gpu' in navigator ? 'gpu' : 'cpu';
}

const checkerboard: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(45deg, #232a45 25%, transparent 25%), linear-gradient(-45deg, #232a45 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #232a45 75%), linear-gradient(-45deg, transparent 75%, #232a45 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
  backgroundColor: '#1a2035',
};

export default function ImageBackgroundRemovalPage() {
  const { lang } = useLang();
  const t = ui[lang].imageBackgroundRemoval;

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [progressText, setProgressText] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [quality, setQuality] = useState<Quality>('medium');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processImage = useCallback(async (target: File) => {
    setStatus('loading');
    setProgressText('');
    const progress = (key: string, current: number, total: number) => {
      setStatus('processing');
      setProgressText(total > 0 ? `${key} ${Math.round((current / total) * 100)}%` : key);
    };
    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const model = QUALITY_TO_MODEL[quality];
      const device = detectDevice();
      let blob: Blob;
      try {
        blob = await removeBackground(target, { model, device, proxyToWorker: true, progress });
      } catch (gpuErr) {
        if (device !== 'gpu') throw gpuErr;
        // GPU 裝置可能初始化失敗，退回 CPU 再試一次
        console.warn('[image-background-removal] gpu attempt failed, retrying on cpu', gpuErr);
        blob = await removeBackground(target, { model, device: 'cpu', proxyToWorker: true, progress });
      }
      setResultUrl(URL.createObjectURL(blob));
      setStatus('done');
      fetch('/api/tools/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: TOOL_SLUG }),
      }).catch(() => {});
    } catch (err) {
      console.error('[image-background-removal]', err);
      setStatus('error');
    }
  }, [quality]);

  const handleFile = useCallback((selected: File) => {
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setStatus('error');
      setWarning(null);
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setResultUrl(null);
    setWarning(selected.size > LARGE_FILE_THRESHOLD ? t.fileTooLarge : null);
    void processImage(selected);
  }, [previewUrl, resultUrl, processImage, t.fileTooLarge]);

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setStatus('idle');
    setWarning(null);
    setProgressText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    const base = file?.name.replace(/\.[^.]+$/, '') || 'image';
    a.download = `${base}-no-bg.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isBusy = status === 'loading' || status === 'processing';

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{t.title}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t.subtitle}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t.qualityLabel}</span>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {([
            ['small', t.qualityFast],
            ['medium', t.qualityStandard],
            ['large', t.qualityHigh],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setQuality(value)}
              style={{
                padding: '5px 14px',
                borderRadius: '9999px',
                border: `1px solid ${quality === value ? 'var(--accent-blue)' : 'rgba(59,130,246,0.25)'}`,
                background: quality === value ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.07)',
                color: quality === value ? 'var(--accent-blue-light)' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) handleFile(dropped);
          }}
          style={{
            border: `2px dashed ${isDragging ? 'var(--accent-blue)' : 'var(--border)'}`,
            borderRadius: '12px',
            padding: '4rem 2rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: isDragging ? 'rgba(59,130,246,0.06)' : 'var(--bg-card)',
            transition: 'all 0.15s',
          }}
        >
          <UploadCloud size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.4rem' }}>{t.uploadPrompt}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t.uploadHint}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) handleFile(selected);
            }}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div>
          {warning && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', color: '#eab308', fontSize: '0.85rem', marginBottom: '1rem' }}>
              <AlertTriangle size={16} /> {warning}
            </div>
          )}

          {status === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={16} /> {t.error}</span>
              <span style={{ color: 'var(--text-muted)', paddingLeft: '24px' }}>{t.browserUnsupported}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>{t.before}</p>
              <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                {previewUrl && <img src={previewUrl} alt={t.before} style={{ width: '100%', display: 'block' }} />}
              </div>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>{t.after}</p>
              <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', minHeight: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', ...checkerboard }}>
                {resultUrl ? (
                  <img src={resultUrl} alt={t.after} style={{ width: '100%', display: 'block' }} />
                ) : isBusy ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', padding: '2rem' }}>
                    <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent-blue-light)' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center' }}>
                      {status === 'loading' ? t.loadingModel : t.processing}
                    </p>
                    {progressText && <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{progressText}</p>}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleDownload}
              disabled={status !== 'done'}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 18px', borderRadius: '8px', border: 'none',
                background: status === 'done' ? 'var(--accent-blue)' : 'var(--bg-card)',
                color: status === 'done' ? '#fff' : 'var(--text-muted)',
                fontSize: '0.9rem', fontWeight: 600,
                cursor: status === 'done' ? 'pointer' : 'not-allowed',
              }}
            >
              <Download size={16} /> {t.download}
            </button>
            <button
              onClick={handleReset}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 18px', borderRadius: '8px',
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <RotateCcw size={16} /> {t.reset}
            </button>
          </div>
        </div>
      )}

      {status === 'error' && !file && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '0.85rem', marginTop: '1rem' }}>
          <AlertTriangle size={16} /> {t.invalidFormat}
        </div>
      )}
    </div>
  );
}
