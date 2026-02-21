import { WebhookPayload, WebhookResponse } from '../types';

const WEBHOOK_URL = 'https://apex-dev.app.n8n.cloud/webhook/AI_Appointment';

/**
 * Posts the conversation state to the AI webhook.
 */
export const postToWebhook = async (payload: WebhookPayload): Promise<WebhookResponse> => {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 429) {
        // Simple retry logic could go here, for now throwing to be caught by UI
        throw new Error('Too many requests. Please try again in a moment.');
      }
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Validate that data is an array as expected
    if (Array.isArray(data)) {
        return data as WebhookResponse;
    } else if (typeof data === 'object' && data !== null) {
        // Handle case where n8n might return a single object instead of array
        return [data] as WebhookResponse;
    }
    
    return [];
  } catch (error) {
    console.error('Webhook Error:', error);
    throw error;
  }
};