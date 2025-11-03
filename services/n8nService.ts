// services/n8nService.ts
import { N8N_WEBHOOK } from '../constants';

export class WebhookError extends Error {
  type: 'Network' | 'Server' | 'Parse' | 'Unknown';
  constructor(message: string, type: WebhookError['type'] = 'Unknown') {
    super(message);
    this.type = type;
    this.name = 'WebhookError';
  }
}

export type WebhookResponse = {
  reply: string;
  audio_url?: string | null;
  audio_base64?: string | null;
  imageUrl?: string | null;
};

/**
 * Send transcript + client_request_id + optional file to n8n webhook.
 * If fileBlob is provided, send multipart/form-data. Otherwise send JSON.
 */
export async function sendToWebhook(
  transcript: string,
  clientRequestId: string,
  fileBlob?: Blob | File
): Promise<WebhookResponse> {
  if (!N8N_WEBHOOK) {
    throw new WebhookError('Missing n8n webhook URL. Please set VITE_N8N_WEBHOOK in your environment variables.', 'Unknown');
  }
  try {
    let res: Response;

    if (fileBlob) {
      // multipart/form-data path
      const form = new FormData();
      form.append('transcript', transcript || '');
      form.append('client_request_id', clientRequestId || '');
      form.append('file_present', 'true');
      // The file field is named 'file' for n8n to receive it as a binary property
      form.append('file', fileBlob, (fileBlob as File).name || 'upload.bin');

      res = await fetch(N8N_WEBHOOK, {
        method: 'POST',
        // Do not set Content-Type header for FormData; the browser sets it with the correct boundary
        body: form,
      });
    } else {
      // JSON path (file: false)
      res = await fetch(N8N_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript || '',
          client_request_id: clientRequestId || '',
          file: false,
        }),
      });
    }

    if (!res.ok) {
        const errorBody = await res.text().catch(() => 'Could not read error body.');
        const errorMessage = `Server responded with status ${res.status}: ${errorBody}`;
        if (res.status >= 500) throw new WebhookError(errorMessage, 'Server');
        else throw new WebhookError(errorMessage, 'Network');
    }
    
    const responseText = await res.text();
    if (!responseText.trim()) {
      console.warn("Webhook returned an empty but successful response.");
      return {
          reply: "I don't have a response for that.",
          audio_base64: null,
          imageUrl: null,
          audio_url: null,
      };
    }

    let data;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        console.error('Failed to parse webhook JSON response. Raw text:', responseText);
        throw new WebhookError('Received an invalid response format from the server.', 'Parse');
    }
    
    const payload = Array.isArray(data) ? data[0] : data;

    if (!payload) {
        throw new WebhookError('Empty or invalid response from webhook', 'Parse');
    }

    const replyText = payload.transcript || payload.reply;
    if (typeof replyText !== 'string') {
        console.error('Webhook response payload is missing a valid "transcript" or "reply" string.', payload);
        throw new WebhookError('Received a malformed data structure from the server.', 'Parse');
    }

    return {
      reply: replyText,
      audio_base64: payload.audioBase64 || payload.audio_base64 || null,
      imageUrl: payload.imageUrl || null,
      audio_url: payload.audioUrl || payload.audio_url || null,
    };
  } catch (err: any) {
    console.error("Webhook fetch failed:", err);
    if (err instanceof WebhookError) throw err;
    throw new WebhookError(err.message || 'Failed to process webhook response', err.name === 'AbortError' ? 'Network' : 'Unknown');
  }
}
