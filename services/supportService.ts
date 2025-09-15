// services/supportService.ts
import { VITE_SUPPORT_SHEET_ID, VITE_GOOGLE_API_KEY, VITE_WEBHOOK_SUPPORT_AI_TRAIN } from '../env';
import { SupportRow, GoogleSheetsValuesResponse } from '../types';

const SHEET_ID = VITE_SUPPORT_SHEET_ID;
const API_KEY = VITE_GOOGLE_API_KEY;
const RANGE = 'Sheet1'; // As specified by user

const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

/**
 * Maps the raw array-of-arrays response from Google Sheets API into an array of objects
 * using the first row as headers.
 */
export function mapValuesToObjects(values: string[][]): SupportRow[] {
  if (!values || values.length < 2) return [];
  const header = values[0];
  return values.slice(1).map((row, i) => {
    const obj: { [key: string]: any } = {};
    header.forEach((key, colIndex) => {
      obj[key] = row[colIndex] ?? "";
    });
    obj.rowNumber = i + 2; // Sheet index (header is at row 1)
    return obj as SupportRow;
  });
}

/**
 * Fetches the raw data from the Google Sheet.
 */
export async function fetchSheetData(): Promise<GoogleSheetsValuesResponse> {
  const res = await fetch(url);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const errorMessage = errorBody?.error?.message || `Google Sheets fetch failed with status ${res.status}. Check Sheet ID, tab name ('${RANGE}'), and API key permissions.`;
    throw new Error(errorMessage);
  }
  const data = await res.json();
  console.log("Raw sheet values:", data.values);
  return data;
}


// Mocked write-actions as they require a backend proxy
export async function patchRow(rowNumber: number, updates: Partial<SupportRow>) {
  console.log(`PATCH /api/support/row/${rowNumber}`, { updates });
  await new Promise(resolve => setTimeout(resolve, 500));
  return { status: 'ok', updatedRowNumber: rowNumber };
}

export async function postAction(payload: any) {
  console.log(`POST /api/support/action`, payload);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { status: 'ok', message: 'action_received', emailQueued: true };
}

export async function trainSupport(payload: {
  userEmail: string;
  trainingName: string;
  companyName: string;
  dataType: string;
  dataContent: string;
  tags?: string[];
}) {
  const WEBHOOK_URL = VITE_WEBHOOK_SUPPORT_AI_TRAIN;

  if (!WEBHOOK_URL) {
    throw new Error('Support AI Training webhook URL is not configured.');
  }

  const body = {
    userEmail: payload.userEmail,
    trainingName: payload.trainingName,
    companyName: payload.companyName,
    dataType: payload.dataType,
    dataContent: payload.dataContent,
    tags: payload.tags,
    timestamp: new Date().toISOString(),
    clientId: navigator.userAgent,
    source: 'web-support-training-v1'
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


export async function saveSettings(payload: any) {
  console.log(`POST /api/support/save-settings`, payload);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { status: 'saved', savedAt: new Date().toISOString() };
}