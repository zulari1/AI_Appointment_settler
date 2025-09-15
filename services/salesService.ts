// services/salesService.ts
import { SalesRow, SalesFilter, GoogleSheetsValuesResponse } from '../types';
import { mapValuesToObjects } from '../utils/salesUtils';

const SHEET_ID = "1ZlvyF1V3r18DcvK-Icpz7NbixaWFsKC4Xe5KfVrm9rk";
const API_KEY = "AIzaSyA4XlhMDF3Ft4eLzIf1K1B_mNB9cxSbpB0";
const RANGE = "Sheet1";

const API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;


/**
 * Fetches and processes live data from the Google Sheet.
 * Note: Client-side filtering is now handled in the component.
 */
export async function fetchRows(): Promise<SalesRow[]> {
  console.log('Fetching live data from Google Sheets...');
  
  const res = await fetch(API_URL);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const errorMessage = errorBody?.error?.message || `Google Sheets fetch failed with status ${res.status}. Check Sheet ID, tab name ('${RANGE}'), and API key permissions.`;
    throw new Error(errorMessage);
  }
  
  const data: GoogleSheetsValuesResponse = await res.json();
  if (!data.values) {
    console.warn("Google Sheet response is missing 'values' array.");
    return [];
  }
  
  return mapValuesToObjects(data.values);
}

// Mocked write-actions as they require a backend proxy
export async function patchRow(rowNumber: number, updates: Partial<SalesRow>): Promise<{ status: string, updatedRowNumber: number }> {
  console.log(`Mock PATCH /api/sales/row/${rowNumber}`, { updates });
  await new Promise(resolve => setTimeout(resolve, 500));
  return { status: "ok", updatedRowNumber: rowNumber };
}

export async function saveSettings(payload: any): Promise<{ status: string, message: string, savedAt: string }> {
  console.log('Mock POST /api/sales/settings', payload);
  await new Promise(resolve => setTimeout(resolve, 600));
  return { status: "ok", message: "settings_saved", savedAt: new Date().toISOString() };
}

export async function train(payload: any): Promise<{ status: string, jobId: string, estimatedSeconds: number }> {
  console.log('Mock POST /api/sales/train', payload);
  await new Promise(resolve => setTimeout(resolve, 1200));
  return { status: "queued", jobId: `train_${Date.now()}`, estimatedSeconds: 120 };
}