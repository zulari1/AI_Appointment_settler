// env.ts
// Centralized environment variables for the application.
// NOTE: In production, these should be sourced from a secure .env config.

// Old research webhook, replaced by VITE_WEBHOOK_RESEARCH_AI
export const VITE_WEBHOOK_SUBMIT = 'https://zilari.app.n8n.cloud/webhook/submit-research';
export const VITE_WEBHOOK_GET_HISTORY = 'https://zilari.app.n8n.cloud/webhook/RESEARCH_RESULTS';
export const VITE_WEBHOOK_GMAIL = 'https://zilari.app.n8n.cloud/webhook/gmail';

// Deep Research AI - As per PRD
export const VITE_DEEP_RESEARCH_SHEET_ID = '1tELP78w0Dd1PcjIxZrghX1lB-4wXb7r9KkRt2gKTNv8';
export const VITE_WEBHOOK_RESEARCH_AI = 'https://zilari.app.n8n.cloud/webhook/Research_AI';


// --- FINAL BLUEPRINT: Web AI Assistant ---
export const VITE_WEB_AI_SHEET_ID = '1LPg0GNVL1WT9JzRj2-sx2PO3_c7p7y2wgxZlPWTPnos';
export const VITE_WEB_AI_TRAINING_DATA_SHEET_ID = '1DgpGyH3MapiErPsGd0NSS6jNJaGdYk9GUxzmrB3DJaQ';
export const VITE_WEBHOOK_CHECK_ACCESS = 'https://zilari.app.n8n.cloud/webhook/check-access';
export const VITE_WEBHOOK_WEB_AI_CONFIG = 'https://zilari.app.n8n.cloud/webhook/web-ai-config';
export const VITE_WEBHOOK_WEB_AI_TRAIN = 'https://zilari.app.n8n.cloud/webhook/web-ai-train';
export const VITE_WEBHOOK_WEB_AI_ADD_DOC = 'https://zilari.app.n8n.cloud/webhook/training-doc';
export const VITE_WEBHOOK_WEB_AI_SEARCH = 'https://zilari.app.n8n.cloud/webhook/web-ai-search'; // For live chat
export const VITE_WEBHOOK_EMBED_REQUEST = 'https://zilari.app.n8n.cloud/webhook/Client_embedded_code';
export const VITE_WEBHOOK_WEB_AI_STATUS = 'https://zilari.app.n8n.cloud/webhook/web-ai-status'; // For polling job status
export const VITE_WEBHOOK_WEB_AI_ANALYTICS = 'https://zilari.app.n8n.cloud/webhook/web-ai-analytics';
export const VITE_WEBHOOK_WEB_AI_LOGS = 'https://zilari.app.n8n.cloud/webhook/web-ai-logs';

// --- DEPRECATED Web AI ---
// VITE_WEBHOOK_SEARCH_TRAIN_DATA is no longer used in the new blueprint
// VITE_WEB_AI_HISTORY_SHEET_ID is replaced by VITE_WEB_AI_SHEET_ID
// VITE_WEB_AI_TODAYS_CONVOS_SHEET_ID is obsolete, use analytics endpoint


// Customer Support AI
export const VITE_SUPPORT_SHEET_ID = '1cYaAG2upk2zp3OKrCQawZJO-L2tcjxGz8Y_LVCJ8lBI';
export const VITE_WEBHOOK_SUPPORT_SETTINGS_SAVE = 'https://zilari.app.n8n.cloud/webhook/support-settings-save';
export const VITE_SUPPORT_CONVERSATIONS_SHEET_ID = '1XKclyo82sQ49Tx2ZJhGT81EyHNd1s-H4-BR-6jp7L8M';
export const VITE_WEBHOOK_SUPPORT_AI_TRAIN = 'https://zilari.app.n8n.cloud/webhook/TRAIN_CUSTUMOR_AI';
export const VITE_PERFORMANCE_TRENDS_SHEET_ID = '1XKclyo82sQ49Tx2ZJhGT81EyHNd1s-H4-BR-6jp7L8M';
export const VITE_PERFORMANCE_TRENDS_SHEET_GID = '983570399';

// Sales AI Agent & Dashboard
export const VITE_GOOGLE_API_KEY = 'AIzaSyA4XlhMDF3Ft4eLzIf1K1B_mNB9cxSbpB0';
export const VITE_SHEET_ID = '1HyrglwXe9ddkPviY_VTJPw9b4oHnQrdPe2rReg7p37Q';
export const VITE_DASHBOARD_KPI_SHEET_ID = '13pOsdrU1OosLNxRLGcpqe_dQVVrrNMeKbfQzKSzdJkw';
export const VITE_WEBHOOK_SALES_AI_TRAIN = 'https://zilari.app.n8n.cloud/webhook/TRAIN_CUSTUMOR_AI';
export const VITE_MAIN_DASHBOARD_SHEET_ID = '1mLUMsMH-vu1IkSdb37Cb5ky30_7y6IL2smSEw3p4aK0';

// Lead Generation System
export const VITE_LEADGEN_SHEET_ID = '12pMEMtJMhwMNfDN8MPUYJQR_9B2BEmCG-2hKw_fcbOA';
export const VITE_WEBHOOK_LEAD_RESEARCH = 'https://zilari.app.n8n.cloud/webhook/LEAD_RESEARCH';
export const VITE_WEBHOOK_LEAD_RESEARCH_AI_CHAT = 'https://zilari.app.n8n.cloud/webhook/AI';
export const VITE_RESEARCH_SHEET_ID = '1f17Nk09znGFR-3YYt4Wggq_gyIQsDm9GLygx2jhtypc';
export const VITE_WEBHOOK_LEAD_HUNT = 'https://zilari.app.n8n.cloud/webhook/lead-hunt';
export const VITE_WEBHOOK_EMAIL_PERSONALIZE = 'https://zilari.app.n8n.cloud/webhook/email-personalize';
export const VITE_WEBHOOK_EMAIL_PERSONALIZE_BATCH = 'https://zilari.app.n8n.cloud/webhook/email-personalize-batch';
export const VITE_WEBHOOK_EMAIL_PERSONALIZE_SCHEDULE = 'https://zilari.app.n8n.cloud/webhook/email-personalize-schedule';
export const VITE_WEBHOOK_EMAIL_PERSONALIZE_UNIVERSAL_SCHEDULE = 'https://zilari.app.n8n.cloud/webhook/email-personalize-universal-schedule';
export const VITE_WEBHOOK_OUTREACH_SCHEDULE = 'https://zilari.app.n8n.cloud/webhook/outreach-schedule';
export const VITE_WEBHOOK_OUTREACH_STATUS = 'https://zilari.app.n8n.cloud/webhook/outreach-status';
export const VITE_WEBHOOK_LEADGEN_SETTINGS = 'https://zilari.app.n8n.cloud/webhook/leadgen/settings';
export const VITE_WEBHOOK_CHAT_WITH_DATA = 'https://zilari.app.n8n.cloud/webhook/CHAT_WITH_DATA';
export const VITE_WEBHOOK_AI_SCRAPE = 'https://zilari.app.n8n.cloud/webhook/AI';
export const VITE_WEBHOOK_LEADS_APPEND = 'https://zilari.app.n8n.cloud/webhook/leads-append';
export const VITE_WEBHOOK_LEAD_UPDATE_STATUS = 'https://zilari.app.n8n.cloud/webhook/LEAD_UPDATE_STATUS';
export const VITE_WEBHOOK_BATCH_STATUS = 'https://zilari.app.n8n.cloud/webhook/batch-status';
export const VITE_REPLIER_SHEET_URL = "https://sheets.googleapis.com/v4/spreadsheets/1pGaTUEmv4e_T2b0IjilAyv5-bRTyvx9qSsBxC-itiF8/values/Sheet1?key=AIzaSyA4XlhMDF3Ft4eLzIf1K1B_mNB9cxSbpB0";
export const VITE_WEBHOOK_SAVE_SETTING_REPLIER = 'https://zilari.app.n8n.cloud/webhook/save_setting_replier';
export const VITE_WEBHOOK_TRAIN_REPLIER = 'https://zilari.app.n8n.cloud/webhook/train_replier';
export const VITE_WEBHOOK_REPLIER_ACTION = 'https://zilari.app.n8n.cloud/webhook/repiler_action';

// Email Templates
export const VITE_EMAIL_TEMPLATES_SHEET_ID = '1qA2b3c4D5e6F7g8H9i0J_KkLlMmNnOoPpQqRrSsTtUu'; // Example ID
export const VITE_WEBHOOK_EMAIL_TEMPLATES = 'https://zilari.app.n8n.cloud/webhook/email-templates';


// Custom Solution Builder
export const VITE_WEBHOOK_CUSTOM_SOLUTION = 'https://zilari.app.n8n.cloud/webhook/Custom_solution_form';
export const VITE_WEBHOOK_CUSTOM_SOLUTION_AI = 'https://zilari.app.n8n.cloud/webhook/custum_solution_ai';
export const VITE_WEBHOOK_ANALYZER_AI = 'https://zilari.app.n8n.cloud/webhook/analyzer_AI';
export const VITE_WEBHOOK_BOOK_MEETINGS = 'https://zilari.app.n8n.cloud/webhook/book_meetings';
export const VITE_WEBHOOK_EMAIL_AUTOMATION = 'https://zilari.app.n8n.cloud/webhook/email_automation';
export const VITE_WEBHOOK_USER_TRACKING = 'https://zilari.app.n8n.cloud/webhook/user_tracking';
export const VITE_WEBHOOK_LEAD_MANAGEMENT = 'https://zilari.app.n8n.cloud/webhook/lead_management';
export const VITE_CUSTOM_SOLUTIONS_SHEET_ID = '1fAB3cdefG4hijklM5nopQ6rstU7vwxY8z'; // Placeholder ID


// Global AI Assistant
export const VITE_WEBHOOK_AI_ASSISTANT = 'https://zilari.app.n8n.cloud/webhook/AI_ASSISTANT';

// Gmail & Calendar OAuth Integration
export const VITE_GMAIL_CLIENT_ID = '218065170067-hov9kvvahfbg6988h52jgqefm4lgm3dh.apps.googleusercontent.com';
export const VITE_WEBHOOK_GOOGLE_OAUTH = 'https://zilari.app.n8n.cloud/webhook/collect_access';

// CRM Automation
export const VITE_WEBHOOK_CRM_SAVE_CREDS = 'https://zilari.app.n8n.cloud/webhook/crm-save-creds';
export const VITE_WEBHOOK_CRM_FETCH_EVENTS = 'https://zilari.app.n8n.cloud/webhook/crm-fetch-events';

// Influencer Research
export const VITE_WEBHOOK_INFLUENCER_RESEARCH = 'https://zilari.app.n8n.cloud/webhook/influencer-research';
// FIX: Add missing VITE_WEBHOOK_DASHBOARD_KPI
export const VITE_WEBHOOK_DASHBOARD_KPI = 'https://zilari.app.n8n.cloud/webhook/dashboard-kpi';

// Knowledge Base
export const VITE_WEBHOOK_KNOWLEDGE_BASE = 'https://zilari.app.n8n.cloud/webhook/Guides';

// Contact Form
export const VITE_WEBHOOK_CONTACT_FORM = 'https://zilari.app.n8n.cloud/webhook/contact_info';

// Microservices
export const VITE_WEBHOOK_AI_READINESS_AUDIT_START = 'https://zilari.app.n8n.cloud/webhook/ai-readiness-audit';
export const VITE_PREVIOUS_AUDITS_SHEET_ID = '16hKsoOaDQkJY34E44LL-irWv6CGDF4Uo5Q8z0cO6Uj0';
export const VITE_WEBHOOK_JOB_STATUS = 'https://zilari.app.n8n.cloud/webhook/job-status';
export const VITE_WEBHOOK_LEAD_GEN_START = 'https://zilari.app.n8n.cloud/webhook/lead-gen/start';
export const VITE_WEBHOOK_WEBSITE_REPORT = 'https://zilari.app.n8n.cloud/webhook/website-analyzer';
export const VITE_WEBHOOK_AI_EMAIL_REWRITE = 'https://zilari.app.n8n.cloud/webhook/ai-email-rewrite';
export const VITE_WEBHOOK_FINAL_OUTPUT = 'https://zilari.app.n8n.cloud/webhook/final_output';
export const VITE_WEBHOOK_STRATEGY_CALL_START = 'https://zilari.app.n8n.cloud/webhook/strategy-call/start';
export const VITE_WEBHOOK_AI_STRATEGY_CALL = 'https://zilari.app.n8n.cloud/webhook/strategy_call_analyzer';
export const VITE_WEBHOOK_AI_STRATEGY_SLOTS = 'https://zilari.app.n8n.cloud/webhook/AI-Strategy_Booking';
export const VITE_WEBHOOK_SIMULATOR_START = 'https://zilari.app.n8n.cloud/webhook/simulator/start';
export const VITE_WEBHOOK_SIMULATOR_CREATE = 'https://zilari.app.n8n.cloud/webhook/ai-sim-create';
export const VITE_WEBHOOK_SIMULATOR_DAY = 'https://zilari.app.n8n.cloud/webhook/ai-sim-day';
export const VITE_WEBHOOK_SIMULATOR_GET_SHEET = 'https://zilari.app.n8n.cloud/webhook/sheets-get';
export const VITE_MICROSERVICES_DASHBOARD_SHEET_ID = '1H7l3CzFc-1wgk19mtq0xCB3VoAI9HEm6WOewtorM7Yk';
export const VITE_MICROSERVICES_ROI_SHEET_ID = '1VB4zVau-EgmjTdm0KM1I1H9W88w1JwqIkh5ZifPGAZg';


// --- NEW CONFIGS FOR MINI LEAD GEN ---
export const GOOGLE_SHEETS = {
  SHEET_ID: '1f17Nk09znGFR-3YYt4Wggq_gyIQsDm9GLygx2jhtypc',
  TAB_NAME: 'LeadDataMaster',
  API_KEY: 'AIzaSyA4XlhMDF3Ft4eLzIf1K1B_mNB9cxSbpB0',
};

export const MINI_LEADGEN = {
  // if you have a server proxy, set to true; otherwise leave false (dev-only direct Sheets read)
  USE_PROXY: false
};

export const WEBHOOKS = {
  LEAD_HUNT: 'https://zilari.app.n8n.cloud/webhook/AI',
  LEAD_RESEARCH: 'https://zelari.app.n8n.cloud/webhook/LEAD_RESEARCH',
  CHAT_WITH_DATA: 'https://zilari.app.n8n.cloud/webhook/CHAT_WITH_DATA',
  SETTINGS: 'https://zilari.app.n8n.cloud/webhook/leadgen/settings',
};