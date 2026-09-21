// 從影片檔解碼出 16kHz 單聲道 PCM，供 Whisper 使用。全程在瀏覽器內完成，不會上傳檔案。
//
// 優先用瀏覽器原生 Web Audio API（快、不用額外下載任何東西），但部分 Linux 上的
// 開源 Chromium 編譯版本因專利授權緣故未內建 AAC/H.264 解碼器，decodeAudioData 會
// 直接丟 EncodingError，即使檔案本身確實有音軌（可用 ffprobe 驗證）。
// 這種情況下退回用 ffmpeg.wasm 在瀏覽器內重新解碼一次，當作備援。
const WHISPER_SAMPLE_RATE = 16000;
const FFMPEG_CORE_BASE_URL = '/ffmpeg-core';

export interface ExtractProgress {
  stage: 'native' | 'ffmpeg-load' | 'ffmpeg-decode';
  percent: number | null;
}

async function extractViaWebAudio(file: File): Promise<Float32Array> {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new AudioContext({ sampleRate: WHISPER_SAMPLE_RATE });
  try {
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    if (decoded.numberOfChannels > 1) {
      // 立體聲下混為單聲道，sqrt(2) 為保留感知音量的標準縮放係數
      const SCALING_FACTOR = Math.sqrt(2);
      const left = decoded.getChannelData(0);
      const right = decoded.getChannelData(1);
      const merged = new Float32Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        merged[i] = (SCALING_FACTOR * (left[i] + right[i])) / 2;
      }
      return merged;
    }
    return decoded.getChannelData(0);
  } finally {
    await audioCtx.close();
  }
}

let ffmpegPromise: ReturnType<typeof loadFfmpeg> | null = null;

async function loadFfmpeg(onProgress?: (info: ExtractProgress) => void) {
  const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
    import('@ffmpeg/ffmpeg'),
    import('@ffmpeg/util'),
  ]);
  const ffmpeg = new FFmpeg();
  ffmpeg.on('progress', ({ progress }) => {
    onProgress?.({ stage: 'ffmpeg-decode', percent: Math.round(Math.min(1, Math.max(0, progress)) * 100) });
  });
  // @ffmpeg/ffmpeg internally does `new Worker(new URL(classWorkerURL, import.meta.url))`.
  // Under Turbopack, that module's own `import.meta.url` resolves to a bogus `file:///` base
  // (a bundling quirk, not something we control), so a path-absolute classWorkerURL like
  // "/ffmpeg-core/worker/worker.js" gets merged onto that broken base and ends up as
  // "file:///ffmpeg-core/worker/worker.js". Passing a fully-qualified absolute URL (scheme +
  // host) sidesteps this: per the URL spec, an absolute URL ignores whatever base it's given.
  const classWorkerURL = new URL(`${FFMPEG_CORE_BASE_URL}/worker/worker.js`, window.location.origin).href;
  await ffmpeg.load({
    classWorkerURL,
    coreURL: await toBlobURL(`${FFMPEG_CORE_BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${FFMPEG_CORE_BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  return ffmpeg;
}

function getFfmpeg(onProgress?: (info: ExtractProgress) => void) {
  if (!ffmpegPromise) {
    ffmpegPromise = loadFfmpeg(onProgress);
    ffmpegPromise.catch(() => {
      ffmpegPromise = null; // 失敗時清除快取，允許下次重試
    });
  }
  return ffmpegPromise;
}

async function extractViaFfmpeg(file: File, onProgress?: (info: ExtractProgress) => void): Promise<Float32Array> {
  onProgress?.({ stage: 'ffmpeg-load', percent: null });
  const { fetchFile } = await import('@ffmpeg/util');
  const ffmpeg = await getFfmpeg(onProgress);

  const inputName = `input${file.name.match(/\.[^.]+$/)?.[0] ?? '.mp4'}`;
  const outputName = 'output.pcm';
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  try {
    await ffmpeg.exec(['-i', inputName, '-vn', '-ac', '1', '-ar', String(WHISPER_SAMPLE_RATE), '-f', 'f32le', outputName]);
    const data = await ffmpeg.readFile(outputName);
    if (typeof data === 'string' || data.byteLength === 0) {
      throw new Error('ffmpeg produced no audio output');
    }
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const floatCount = Math.floor(data.byteLength / 4);
    const floats = new Float32Array(floatCount);
    for (let i = 0; i < floatCount; i++) floats[i] = view.getFloat32(i * 4, true);
    return floats;
  } finally {
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});
  }
}

export async function extractPcm16kMono(file: File, onProgress?: (info: ExtractProgress) => void): Promise<Float32Array> {
  try {
    onProgress?.({ stage: 'native', percent: null });
    return await extractViaWebAudio(file);
  } catch (nativeErr) {
    console.warn('[video-subtitle-extraction] native decode failed, falling back to ffmpeg.wasm', nativeErr);
    return extractViaFfmpeg(file, onProgress);
  }
}
