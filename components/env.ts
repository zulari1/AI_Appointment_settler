// components/env.ts
import { VITE_WEBHOOK_AI_SCRAPE, VITE_WEBHOOK_LEAD_UPDATE_STATUS } from '../env';

export const GOOGLE_SHEETS = {
  SHEET_ID: '1f17Nk09znGFR-3YYt4Wggq_gyIQsDm9GLygx2jhtypc',
  TAB_NAME: 'LeadDataMaster', // <-- set EXACT tab name from your sheet
  API_KEY: 'AIzaSyA4XlhMDF3Ft4eLzIf1K1B_mNB9cxSbpB0',
};

export const MINI_LEADGEN = {
  // if you have a server proxy, set to true; otherwise leave false (dev-only direct Sheets read)
  USE_PROXY: false
};

// Your n8n webhooks (only what we need right now)
export const WEBHOOKS = {
  LEAD_HUNT: VITE_WEBHOOK_AI_SCRAPE,
  LEAD_RESEARCH: 'https://zelari.app.n8n.cloud/webhook/LEAD_RESEARCH',
  CHAT_WITH_DATA: 'https://zelari.app.n8n.cloud/webhook/CHAT_WITH_DATA',
  SETTINGS: 'https://zelari.app.n8n.cloud/webhook/leadgen/settings',
  LEAD_UPDATE_STATUS: VITE_WEBHOOK_LEAD_UPDATE_STATUS,
  // FYI: Email warmup webhook is skipped when user connects email in main app
};
