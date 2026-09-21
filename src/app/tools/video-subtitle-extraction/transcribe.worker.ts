import { pipeline } from '@huggingface/transformers';
import type { TranscriptChunk } from './srt';

export type WhisperLanguage = 'zh' | 'en' | 'auto';

type InMessage = {
  type: 'transcribe';
  audio: Float32Array;
  language: WhisperLanguage;
};

export type OutMessage =
  | { type: 'progress'; status: string; percent: number | null }
  | { type: 'result'; text: string; chunks: TranscriptChunk[] }
  | { type: 'error'; message: string };

type Transcriber = (
  audio: Float32Array,
  options: Record<string, unknown>
) => Promise<{ text: string; chunks?: TranscriptChunk[] }>;

interface ProgressInfo {
  status: string;
  file?: string;
  loaded?: number;
  total?: number;
}

// self 在 module worker 中沒有 "webworker" lib 型別可用（專案 tsconfig 只載入 dom），
// 用最小介面自行收斂需要的形狀，避免與 dom lib 的全域型別衝突。
const ctx = self as unknown as {
  postMessage: (message: OutMessage) => void;
  onmessage: ((event: MessageEvent<InMessage>) => void) | null;
  navigator: { gpu?: { requestAdapter: () => Promise<unknown> } };
};

function post(message: OutMessage) {
  ctx.postMessage(message);
}

// `'gpu' in navigator` 只代表瀏覽器認識這個 API，不代表真的能取得 GPU adapter
// （常見於無 GPU 的環境，如某些 headless/虛擬機）。必須實際 requestAdapter() 才能確認，
// 否則 pipeline() 用 webgpu 失敗後，onnxruntime-web 的全域狀態會被污染，
// 導致緊接著重試 wasm 也會失敗並丟出同一個 webgpu 錯誤。
async function detectDevice(): Promise<'webgpu' | 'wasm'> {
  try {
    const adapter = await ctx.navigator.gpu?.requestAdapter();
    return adapter ? 'webgpu' : 'wasm';
  } catch {
    return 'wasm';
  }
}

function loadTranscriber(device: 'webgpu' | 'wasm'): Promise<Transcriber> {
  return pipeline('automatic-speech-recognition', 'Xenova/whisper-base', {
    device,
    progress_callback: (info: ProgressInfo) => {
      if (info.status === 'progress' && info.total) {
        post({
          type: 'progress',
          status: info.file ?? 'model',
          percent: Math.round(((info.loaded ?? 0) / info.total) * 100),
        });
      } else {
        post({ type: 'progress', status: info.status, percent: null });
      }
    },
  }) as unknown as Promise<Transcriber>;
}

// 模型載入後快取在 worker 存活期間內重複使用，避免每次轉錄都重新初始化 session
let transcriberPromise: Promise<Transcriber> | null = null;

function getTranscriber(): Promise<Transcriber> {
  if (!transcriberPromise) {
    transcriberPromise = (async () => {
      const device = await detectDevice();
      try {
        return await loadTranscriber(device);
      } catch (err) {
        if (device === 'wasm') throw err;
        // 偵測到 adapter 但初始化階段仍失敗時，退回 wasm 再試一次
        return loadTranscriber('wasm');
      }
    })();
    transcriberPromise.catch(() => {
      transcriberPromise = null; // 失敗時清除快取，允許下次重試
    });
  }
  return transcriberPromise;
}

ctx.onmessage = async (event) => {
  if (event.data.type !== 'transcribe') return;
  const { audio, language } = event.data;

  try {
    const transcriber = await getTranscriber();

    post({ type: 'progress', status: 'transcribing', percent: null });

    const output = await transcriber(audio, {
      language: language === 'auto' ? undefined : language,
      task: 'transcribe',
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true,
    });

    const chunks: TranscriptChunk[] =
      output.chunks && output.chunks.length > 0
        ? output.chunks
        : [{ timestamp: [0, null], text: output.text }];

    post({ type: 'result', text: output.text, chunks });
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
