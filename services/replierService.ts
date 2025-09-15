// services/replierService.ts
import { VITE_WEBHOOK_SAVE_SETTING_REPLIER, VITE_WEBHOOK_TRAIN_REPLIER, VITE_REPLIER_SHEET_URL, VITE_WEBHOOK_REPLIER_ACTION } from '../env';
import { normalizeSheetResponse } from '../utils/replierUtils';
import { ReplierRow } from '../types';

// --- API Wrapper Functions ---

async function postJson(url: string, payload: any) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const text = await res.text().catch(() => 'No response body');
        throw new Error(`Request failed ${res.status}: ${text}`);
    }
    // Handle cases where n8n returns an empty body on success
    const text = await res.text();
    return text ? JSON.parse(text) : { status: 'ok' };
}

// Caching layer
let lastDataCache: { rows: ReplierRow[], timestamp: Date } | null = null;

/**
 * Fetches and normalizes rows directly from the Google Sheets API with caching.
 * Returns cached data on failure to prevent UI glitches.
 */
export async function fetchReplierRows(): Promise<{ rows: ReplierRow[], lastSync: Date | null, isStale: boolean }> {
    if (!VITE_REPLIER_SHEET_URL) {
        throw new Error("VITE_REPLIER_SHEET_URL is not configured.");
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    try {
        const res = await fetch(VITE_REPLIER_SHEET_URL, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) {
            if (res.status === 429) {
                if (lastDataCache) {
                    console.warn(`Fetch failed (429 Too Many Requests), returning stale data.`);
                    return { rows: lastDataCache.rows, lastSync: lastDataCache.timestamp, isStale: true };
                }
                throw new Error(`429 Too Many Requests`);
            }
            if (lastDataCache) {
                console.warn(`Fetch failed (${res.status}), returning stale data.`);
                return { rows: lastDataCache.rows, lastSync: lastDataCache.timestamp, isStale: true };
            }
            throw new Error(`Failed to fetch sheet: ${res.status}`);
        }

        const json = await res.json();
        const normalizedRows = normalizeSheetResponse(json.values);
        
        lastDataCache = { rows: normalizedRows, timestamp: new Date() };
        
        return { rows: normalizedRows, lastSync: lastDataCache.timestamp, isStale: false };
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (lastDataCache) {
            console.warn(`Fetch threw error, returning stale data.`, error);
            return { rows: lastDataCache.rows, lastSync: lastDataCache.timestamp, isStale: true };
        }
        throw error;
    }
}

/**
 * Triggers the manual, email-based action workflow for one or more leads.
 */
export async function triggerHumanAction(
    action: "approve" | "decline",
    leads: ReplierRow[]
) {
    if (leads.length === 0) return;

    let payload: any;
    const source = "frontend";

    if (leads.length === 1) {
        const lead = leads[0];
        payload = {
            type: "lead_action",
            lead: {
                name: lead['User Name'],
                email: lead['User Email']
            },
            action,
            source
        };
    } else {
        payload = {
            type: "bulk_lead_action",
            leads: leads.map(lead => ({
                name: lead['User Name'],
                email: lead['User Email'],
                action
            })),
            source
        };
    }
    
    return postJson(VITE_WEBHOOK_REPLIER_ACTION, payload);
}


// --- Webhook Functions ---

/**
 * Saves user settings for the Replier agent.
 */
export async function saveReplierSettings(payload: any) {
    return postJson(VITE_WEBHOOK_SAVE_SETTING_REPLIER, payload);
}

/**
 * Submits new training data for the Replier agent.
 */
export async function trainReplier(payload: {
  userEmail: string;
  trainingName: string;
  companyName: string;
  dataType: string;
  dataContent: string;
  tags?: string[];
  qualityScore: number;
}) {
  const WEBHOOK_URL = VITE_WEBHOOK_TRAIN_REPLIER;

  const body = {
    userEmail: payload.userEmail,
    company_name: payload.companyName,
    training_name: payload.trainingName,
    data_type: payload.dataType,
    data_content: payload.dataContent,
    quality_score: payload.qualityScore,
    tags: payload.tags,
    timestamp: new Date().toISOString(),
    clientId: navigator.userAgent,
    source: 'web-replier-training-v1'
  };

  const timeoutMs = 15000;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
        mode: 'cors'
      });

      clearTimeout(id);
      
      const text = await res.text();
      let json: any = null;
      try { json = JSON.parse(text); } catch (e) {}

      if (!res.ok) {
        throw new Error(`Webhook responded ${res.status}: ${text}`);
      }
      
      const responseData = Array.isArray(json) ? json[0] : json;

      if (responseData && (responseData.status === 'queued' || responseData.jobId)) {
        return { jobId: responseData.jobId || `job_${Date.now()}`, raw: responseData };
      }
      
      if (res.status === 200) {
        return { jobId: null, raw: responseData || text };
      }
      
      throw new Error("Unexpected response from server");

    } catch (err: any) {
      if (attempt === 2) {
        throw new Error(`Failed to send training data: ${err.message || err}`);
      }
      await new Promise(r => setTimeout(r, 500 * attempt));
    }
  }
  throw new Error("Training request failed after multiple retries.");
}