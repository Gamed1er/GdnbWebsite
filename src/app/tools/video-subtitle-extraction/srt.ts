export interface TranscriptChunk {
  timestamp: [number, number | null];
  text: string;
}

function pad(value: number, len = 2): string {
  return String(Math.max(0, Math.trunc(value))).padStart(len, '0');
}

export function formatSrtTimestamp(seconds: number): string {
  const total = Math.max(0, seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  const ms = Math.round((total - Math.floor(total)) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

export function chunksToSrt(chunks: TranscriptChunk[]): string {
  return chunks
    .map((chunk, i) => {
      const [start, end] = chunk.timestamp;
      const endSeconds = end ?? start + 2;
      return `${i + 1}\n${formatSrtTimestamp(start)} --> ${formatSrtTimestamp(endSeconds)}\n${chunk.text.trim()}\n`;
    })
    .join('\n');
}

export function chunksToText(chunks: TranscriptChunk[]): string {
  return chunks.map((chunk) => chunk.text.trim()).filter(Boolean).join('\n');
}
