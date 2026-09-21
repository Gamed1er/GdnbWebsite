'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { UploadCloud, Download, FileText, RotateCcw, Loader2, AlertTriangle } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { ui } from '@/lib/i18n';
import { extractPcm16kMono, type ExtractProgress } from './audio';
import { chunksToSrt, chunksToText, type TranscriptChunk } from './srt';
import type { OutMessage, WhisperLanguage } from './transcribe.worker';

const ACCEPTED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const LARGE_FILE_THRESHOLD = 300 * 1024 * 1024; // 300MB
const TOOL_SLUG = 'video-subtitle-extraction';
const CJK_PATTERN = /[一-鿿]/;

type Status = 'idle' | 'decoding' | 'loading' | 'processing' | 'done' | 'error';

async function toTraditional(text: string): Promise<string> {
  if (!CJK_PATTERN.test(text)) return text;
  const OpenCC = await import('opencc-js');
  const convert = OpenCC.Converter({ from: 'cn', to: 'tw' });
  return convert(text);
}

export default function VideoSubtitleExtractionPage() {
  const { lang } = useLang();
  const t = ui[lang].videoSubtitleExtraction;

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [progressText, setProgressText] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [language, setLanguage] = useState<WhisperLanguage>('auto');
  const [chunks, setChunks] = useState<TranscriptChunk[]>([]);
  const [decodeFailed, setDecodeFailed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      workerRef.current?.terminate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('./transcribe.worker.ts', import.meta.url), { type: 'module' });
    }
    return workerRef.current;
  }, []);

  const processVideo = useCallback(async (target: File, targetLanguage: WhisperLanguage) => {
    setStatus('decoding');
    setProgressText(t.decodingAudio);
    setChunks([]);
    setDecodeFailed(false);

    let audio: Float32Array;
    try {
      audio = await extractPcm16kMono(target, (info: ExtractProgress) => {
        const label = info.stage === 'native' ? t.decodingAudio : t.decodingFallback;
        setProgressText(info.percent !== null ? `${label} ${info.percent}%` : label);
      });
    } catch (err) {
      console.error('[video-subtitle-extraction] decode', err);
      setStatus('error');
      setDecodeFailed(true);
      setProgressText(t.noAudioTrack);
      return;
    }

    setStatus('loading');
    const worker = getWorker();

    worker.onmessage = async (event: MessageEvent<OutMessage>) => {
      const msg = event.data;
      if (msg.type === 'progress') {
        setStatus((current) => (current === 'done' || current === 'error' ? current : msg.status === 'transcribing' ? 'processing' : 'loading'));
        setProgressText(msg.percent !== null ? `${msg.status} ${msg.percent}%` : msg.status);
      } else if (msg.type === 'result') {
        const converted = await Promise.all(
          msg.chunks.map(async (chunk) => ({ ...chunk, text: await toTraditional(chunk.text) }))
        );
        setChunks(converted);
        setStatus('done');
        fetch('/api/tools/usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: TOOL_SLUG }),
        }).catch(() => {});
      } else if (msg.type === 'error') {
        console.error('[video-subtitle-extraction] worker', msg.message);
        setStatus('error');
      }
    };

    worker.postMessage({ type: 'transcribe', audio, language: targetLanguage }, [audio.buffer]);
  }, [t.decodingAudio, t.decodingFallback, t.noAudioTrack, getWorker]);

  const handleFile = useCallback((selected: File) => {
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setStatus('error');
      setWarning(null);
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setWarning(selected.size > LARGE_FILE_THRESHOLD ? t.fileTooLarge : null);
    void processVideo(selected, language);
  }, [previewUrl, processVideo, language, t.fileTooLarge]);

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setStatus('idle');
    setWarning(null);
    setProgressText('');
    setChunks([]);
    setDecodeFailed(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadBlob = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const baseName = file?.name.replace(/\.[^.]+$/, '') || 'video';
  const handleDownloadSrt = () => downloadBlob(chunksToSrt(chunks), `${baseName}.srt`, 'application/x-subrip');
  const handleDownloadTxt = () => downloadBlob(chunksToText(chunks), `${baseName}.txt`, 'text/plain');

  const isBusy = status === 'decoding' || status === 'loading' || status === 'processing';

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{t.title}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t.subtitle}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t.languageLabel}</span>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {([
            ['auto', t.languageAuto],
            ['zh', t.languageZh],
            ['en', t.languageEn],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => {
                setLanguage(value);
                if (file && !isBusy) void processVideo(file, value);
              }}
              style={{
                padding: '5px 14px',
                borderRadius: '9999px',
                border: `1px solid ${language === value ? 'var(--accent-blue)' : 'rgba(59,130,246,0.25)'}`,
                background: language === value ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.07)',
                color: language === value ? 'var(--accent-blue-light)' : 'var(--text-secondary)',
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
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={16} /> {decodeFailed ? t.noAudioTrack : (progressText || t.error)}</span>
              {!decodeFailed && <span style={{ color: 'var(--text-muted)', paddingLeft: '24px' }}>{t.browserUnsupported}</span>}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                {previewUrl && <video src={previewUrl} controls style={{ width: '100%', display: 'block' }} />}
              </div>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>{t.preview}</p>
              <div style={{ borderRadius: '8px', border: '1px solid var(--border)', minHeight: '160px', maxHeight: '320px', overflowY: 'auto', background: 'var(--bg-card)', padding: '0.75rem' }}>
                {chunks.length > 0 ? (
                  chunks.map((chunk, i) => (
                    <p key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', lineHeight: 1.6 }}>
                      {chunk.text.trim()}
                    </p>
                  ))
                ) : isBusy ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', padding: '2rem' }}>
                    <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent-blue-light)' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center' }}>
                      {status === 'decoding' ? t.decodingAudio : status === 'loading' ? t.loadingModel : t.processing}
                    </p>
                    {progressText && <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{progressText}</p>}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t.empty}</p>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleDownloadSrt}
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
              <Download size={16} /> {t.downloadSrt}
            </button>
            <button
              onClick={handleDownloadTxt}
              disabled={status !== 'done'}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 18px', borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: status === 'done' ? 'var(--text-secondary)' : 'var(--text-muted)',
                fontSize: '0.9rem', fontWeight: 600,
                cursor: status === 'done' ? 'pointer' : 'not-allowed',
              }}
            >
              <FileText size={16} /> {t.downloadTxt}
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
