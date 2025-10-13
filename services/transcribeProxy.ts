// services/transcribeProxy.ts
import { transcribeWithGroq } from './groqService';

/**
 * This function acts as a client-side proxy to the transcription service.
 * In a production app, this would be an HTTP call to a secure backend endpoint
 * which would then call the Groq API with a secret key.
 * For this sandboxed environment, we call the Groq service directly.
 */
export async function uploadAudioForTranscription(
  blob: Blob,
  filename = 'speech.webm'
): Promise<string> {
  // Directly calling the Groq service as a stand-in for a backend proxy
  return transcribeWithGroq(blob, filename);
}
