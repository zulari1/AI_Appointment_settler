// services/groqService.ts
import { GROQ_API_KEY, GROQ_API_URL } from '../constants';

export async function transcribeWithGroq(
  blob: Blob,
  filename = 'speech.wav',
  timeout = 30000
): Promise<string> {
  if (!GROQ_API_KEY) throw new Error('Missing Groq API key. Please set VITE_GROQ_API_KEY in your environment variables.');

  const url = GROQ_API_URL;
  if (!url) throw new Error('Missing Groq API URL. Please set VITE_GROQ_API_URL in your environment variables.');

  console.log('[Groq STT] Starting transcription', { blobSize: blob.size, url, filename });

  const form = new FormData();
  form.append('file', blob, filename);
  form.append('model', 'whisper-large-v3');

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: form,
      signal: controller.signal,
    });

    clearTimeout(id);
    console.log('[Groq STT] Response status:', res.status);

    const textData = await res.text();
    console.log('[Groq STT] Raw response:', textData);

    if (!res.ok) throw new Error(`Groq STT failed ${res.status}: ${textData}`);

    const json = JSON.parse(textData);
    const text = json.text ?? '';
    console.log('[Groq STT] Parsed transcript:', text);

    return String(text || '').trim();
  } catch (err: any) {
    clearTimeout(id);
    console.error('[Groq STT ERROR]', err);
    throw err;
  }
}
