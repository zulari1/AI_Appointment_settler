// FIX: Add missing support-related types
// FIX: Add missing WebAIHistoryItem type
import { ResearchReport, SalesInboxStats, SalesMeetingStats, SalesPipelineMetrics, SalesMaterials, SalesPendingApproval, GoogleSheetsValuesResponse, SalesAITrainingPayload, Lead, ChatCommandPayload, CustomSolutionPayload, WebAIKnowledgeSearchQuery, CRMCredentialsPayload, CRMEvent, InfluencerResearchRequest, InfluencerResearchResponse, AgentSettingsPayload, ScrapeResponse, DashboardKpis, ContactFormPayload, AiReadinessAuditRequest, JobStatusResponse, MiniLeadsForm, LeadGenStartResponse, StrategyCallForm, StrategyCallStartResponse, SimulatorSignup, SimulatorStartResponse, WebsiteReportRequest, WebsiteReportStartResponse, EmailRewriteInitialRequest, EmailTemplate, EmailRewriteDraftData, EmailRewriteInitialResponse, ChatMessage, LeadGenCampaignPerformance, RawLead, MappedLeadForSheet, SupportConversation, SupportStats, SupportSettings, SupportSettingsPayload, SupportAITrainingPayload, SupportPerformanceTrend, WebAIConfigPayload, WebAITrainingPayload, WebAILogEntry, WebAIAnalyticsData, WebAIEmbedData, WebAITrainingResponse, WebAIConfigResponse, PreviousAuditReport, WebAIHistoryItem, WebsiteReportHtmlResponse, WebsiteReportHistoryItem, AIStrategyFormData, SimulatorDayResponse, DashboardUser, RoiJob, MainDashboardData, RecentEvent, SimulatorJob, WebAITrainingDoc, WebAITrainingAckResponse, UnifiedTrainingDoc, AddTrainingDocResponse } from '../types';
// FIX: Added VITE_WEBHOOK_EMAIL_PERSONALIZE_BATCH to the import list.
// FIX: Add missing VITE_WEBHOOK_EMAIL_TEMPLATES, VITE_WEBHOOK_LEAD_HUNT, and VITE_WEBHOOK_LEAD_RESEARCH variables.
import { VITE_WEBHOOK_RESEARCH_AI, VITE_GMAIL_CLIENT_ID, VITE_GOOGLE_API_KEY, VITE_SHEET_ID, VITE_WEBHOOK_SALES_AI_TRAIN, VITE_SUPPORT_SHEET_ID, VITE_WEBHOOK_SUPPORT_SETTINGS_SAVE, VITE_WEBHOOK_SUPPORT_AI_TRAIN, VITE_LEADGEN_SHEET_ID, VITE_DEEP_RESEARCH_SHEET_ID, VITE_PERFORMANCE_TRENDS_SHEET_ID, VITE_PERFORMANCE_TRENDS_SHEET_GID, VITE_WEBHOOK_LEAD_RESEARCH_AI_CHAT, VITE_WEBHOOK_CUSTOM_SOLUTION, VITE_WEBHOOK_CUSTOM_SOLUTION_AI, VITE_WEBHOOK_GOOGLE_OAUTH, VITE_WEBHOOK_CRM_SAVE_CREDS, VITE_WEBHOOK_CRM_FETCH_EVENTS, VITE_WEBHOOK_INFLUENCER_RESEARCH, VITE_WEBHOOK_DASHBOARD_KPI, VITE_WEBHOOK_KNOWLEDGE_BASE, VITE_WEBHOOK_AI_ASSISTANT, VITE_WEBHOOK_CONTACT_FORM, VITE_WEBHOOK_AI_READINESS_AUDIT_START, VITE_WEBHOOK_JOB_STATUS, VITE_WEBHOOK_LEAD_GEN_START, VITE_WEBHOOK_STRATEGY_CALL_START, VITE_WEBHOOK_SIMULATOR_START, VITE_WEBHOOK_WEBSITE_REPORT, VITE_WEBHOOK_AI_EMAIL_REWRITE, VITE_EMAIL_TEMPLATES_SHEET_ID, VITE_WEBHOOK_LEADS_APPEND, VITE_WEBHOOK_LEADGEN_SETTINGS, VITE_WEBHOOK_EMAIL_PERSONALIZE, VITE_WEBHOOK_EMAIL_PERSONALIZE_BATCH, VITE_WEBHOOK_OUTREACH_SCHEDULE, VITE_WEBHOOK_EMAIL_PERSONALIZE_SCHEDULE, VITE_WEBHOOK_BATCH_STATUS, VITE_WEBHOOK_LEAD_UPDATE_STATUS, VITE_WEBHOOK_EMAIL_PERSONALIZE_UNIVERSAL_SCHEDULE, VITE_WEBHOOK_OUTREACH_STATUS, VITE_WEBHOOK_WEB_AI_CONFIG, VITE_WEBHOOK_WEB_AI_TRAIN, VITE_WEBHOOK_EMBED_REQUEST, VITE_WEBHOOK_WEB_AI_ANALYTICS, VITE_WEBHOOK_WEB_AI_LOGS, VITE_WEBHOOK_WEB_AI_STATUS, VITE_WEBHOOK_WEB_AI_SEARCH, VITE_WEB_AI_SHEET_ID, VITE_WEBHOOK_GMAIL, VITE_WEBHOOK_ANALYZER_AI, VITE_PREVIOUS_AUDITS_SHEET_ID, VITE_WEBHOOK_EMAIL_TEMPLATES, VITE_WEBHOOK_LEAD_HUNT, VITE_WEBHOOK_LEAD_RESEARCH, VITE_RESEARCH_SHEET_ID, VITE_WEBHOOK_AI_STRATEGY_CALL, VITE_WEBHOOK_AI_STRATEGY_SLOTS, VITE_WEBHOOK_SIMULATOR_CREATE, VITE_WEBHOOK_SIMULATOR_DAY, VITE_WEBHOOK_SIMULATOR_GET_SHEET, VITE_MICROSERVICES_DASHBOARD_SHEET_ID, VITE_MICROSERVICES_ROI_SHEET_ID, VITE_CUSTOM_SOLUTIONS_SHEET_ID, VITE_MAIN_DASHBOARD_SHEET_ID, VITE_WEB_AI_TRAINING_DATA_SHEET_ID, VITE_WEBHOOK_TRAIN_REPLIER } from '../env';
import { computeLeadFields } from '../utils/leadUtils';
// FIX: Use native Date for date subtraction as 'subDays' is not available.
import { format } from 'date-fns';
import { postWithTimeout } from '../utils/safeUtils';
import { ICONS } from '../constants';
import React from 'react';

// --- Generic Fetch Helpers (Assuming Server Proxy) ---
async function apiPost(endpoint: string, payload: any) {
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin'
    });
    if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
    return res.json();
}

async function apiGet(endpoint: string, params: Record<string, string> = {}) {
    const url = new URL(endpoint, window.location.origin);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    const res = await fetch(url.toString(), { credentials: 'same-origin' });
    if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
    return res.json();
}


const handleResponse = async (response: Response) => {
    const text = await response.text();
    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${text}`);
    }
    try { 
        return JSON.parse(text); 
    } catch { 
        // Handle cases where the response is not JSON but still valid (e.g., plain text)
        return text; 
    }
};

async function postJson(url: string, payload: any, timeoutMs = 90000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort("Request timed out"), timeoutMs);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
            mode: 'cors'
        });
        clearTimeout(id);
        const text = await res.text();
        if (!res.ok) {
            throw new Error(`${res.status} ${res.statusText}: ${text}`);
        }
        try { 
            // First, try to parse the whole string
            return JSON.parse(text); 
        } catch (e) {
            // If that fails, it might be because n8n is wrapping the JSON.
            // Try to extract a JSON object or array from the string.
            const jsonMatch = text.match(/(\[.*\]|\{.*\})/s);
            if (jsonMatch && jsonMatch[0]) {
                try {
                    return JSON.parse(jsonMatch[0]);
                } catch (e2) {
                    // If even the extracted part fails, we throw an error.
                    console.error("Failed to parse extracted JSON:", e2);
                    throw new Error("Received an invalid JSON response from the server.");
                }
            }
            // If no JSON structure is found, throw an error.
            console.error("Failed to parse response as JSON:", e);
            throw new Error("Received an invalid response from the server.");
        }
    } catch (err: any) {
        clearTimeout(id);
        console.error("Fetch failed:", url, err);
        throw err;
    }
}

async function getJson(url: string, params: Record<string, string> = {}) {
    const urlWithParams = new URL(url);
    Object.keys(params).forEach(key => urlWithParams.searchParams.append(key, params[key]));
    
    const res = await fetch(urlWithParams.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
    });
    // FIX: Corrected variable name from 'response' to 'res'.
    return handleResponse(res);
}


// --- Google Sheets API Helper ---
const getFromGoogleSheet = async (sheetId: string, range: string): Promise<any[][] | null> => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${VITE_GOOGLE_API_KEY}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to fetch from Google Sheet for range ${range}:`, `Network response was not ok: ${response.statusText} - ${errorText}`);
            return null; // Gracefully return null instead of throwing
        }
        const data: GoogleSheetsValuesResponse = await response.json();
        return data.values || null;
    } catch (error) {
        console.error(`Failed to fetch from Google Sheet for range ${range}:`, error);
        return null;
    }
};

// --- Helper function to convert sheet array to object array ---
const mapSheetValuesToObjects = <T extends {}>(values: any[][] | null): T[] => {
    if (!values || values.length < 2) return [];
    const headers = values[0].map(h => h.trim());
    return values.slice(1).map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
            const value = row[index];
            // Basic type conversion for numbers, but avoid for IDs and emails
            if (value && !isNaN(Number(value)) && !header.toLowerCase().includes('id') && !header.toLowerCase().includes('email') && !/percent|value/.test(header.toLowerCase())) {
                obj[header] = Number(value);
            } else {
                obj[header] = value || '';
            }
        });
        return obj as T;
    });
};

// --- Main Dashboard Data (New Blueprint) ---
export const fetchMainDashboardData = async (userEmail: string): Promise<MainDashboardData | null> => {
    const values = await getFromGoogleSheet(VITE_MAIN_DASHBOARD_SHEET_ID, 'Sheet1');
    if (!values) return null;
    const headers = values[0];
    const userRow = values.slice(1).find(row => row[headers.indexOf('user_email')] === userEmail);
    if (!userRow) return null;

    const data: any = {};
    headers.forEach((header: string, index: number) => {
        data[header] = userRow[index];
    });
    return data as MainDashboardData;
};

// --- Recent Activity Helpers ---
const stripQuotes = (s = '') => s.replace(/^"+|"+$/g, '').trim();
const parseNumber = (s: any): number => { const n = Number((String(s) || '').replace(/[^0-9.-]+/g, '')); return Number.isFinite(n) ? n : 0; };
const fmtCurrency = (n: any) => `$${Number(n).toLocaleString()}`;

export const fetchRecentActivity = async (userEmail: string): Promise<RecentEvent[]> => {
    try {
        const [simulatorsRes, roiJobs] = await Promise.all([
            getSimulatorsSheet('any'),
            fetchRoiData(userEmail)
        ]);

        const allEvents: RecentEvent[] = [];

        // Map Simulator Jobs
        if (simulatorsRes?.values) {
             const simulators = mapSheetValuesToObjects<SimulatorJob>(simulatorsRes.values)
                .filter(sim => sim.user_email === userEmail);

            simulators.forEach(sim => {
                ['day1', 'day2', 'day3', 'day4', 'day5'].forEach((day, i) => {
                    const dayNum = i + 1;
                    const completedKey = `${day}_completed`;
                    const summaryKey = `${day}_summary`;
                    if (sim[completedKey] && String(sim[completedKey]).toLowerCase() !== 'false' && sim[summaryKey]) {
                        const eventDate = sim[completedKey] ? new Date(sim[completedKey]) : new Date(sim.updated_at);
                        if (!isNaN(eventDate.getTime())) {
                             allEvents.push({
                                type: 'simulator',
                                date: eventDate,
                                title: `Simulator Day ${dayNum} Complete`,
                                summary: stripQuotes(sim[summaryKey]),
                                link: sim[`day${dayNum}_pdf`] || '/microservices/simulator',
                                icon: ICONS.rocket
                            });
                        }
                    }
                });
            });
        }
        
        // Map ROI Jobs
        roiJobs.forEach(job => {
            if (job.status === 'completed') {
                const eventDate = new Date(job.completed_at);
                 if (!isNaN(eventDate.getTime())) {
                    allEvents.push({
                        type: 'roi',
                        date: eventDate,
                        title: 'ROI Report Generated',
                        summary: `+${job.total_roi_percent} ROI with ${fmtCurrency(parseNumber(job.revenue_upside))} upside for ${job.company}.`,
                        link: job.roi_pdf_url,
                        icon: ICONS.stats
                    });
                }
            }
        });

        return allEvents.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);
    } catch (error) {
        console.error("Failed to fetch recent activity:", error);
        return [];
    }
};


// --- Microservices Dashboard Data ---
export const fetchMicroservicesDashboardData = async (userEmail: string): Promise<DashboardUser | null> => {
    const values = await getFromGoogleSheet(VITE_MICROSERVICES_DASHBOARD_SHEET_ID, 'Sheet1');
    const allUsers = mapSheetValuesToObjects<DashboardUser>(values);
    return allUsers.find(user => user.user_email === userEmail) || allUsers[0] || null; // Fallback to first user for demo
};

export const fetchRoiData = async (userEmail: string): Promise<RoiJob[]> => {
    const values = await getFromGoogleSheet(VITE_MICROSERVICES_ROI_SHEET_ID, 'Sheet1');
    const allJobs = mapSheetValuesToObjects<RoiJob>(values);
    return allJobs.filter(job => job.user_email === userEmail);
};


// --- AI Readiness Audit ---
export const startAiReadinessAudit = async (payload: AiReadinessAuditRequest): Promise<string> => {
    const response = await postJson(VITE_WEBHOOK_AI_READINESS_AUDIT_START, payload);
    if (Array.isArray(response) && response.length > 0 && response[0].html) {
        return response[0].html;
    }
    throw new Error('Invalid response from AI readiness audit service');
};

export const fetchPreviousAudits = async (userEmail: string): Promise<PreviousAuditReport[]> => {
    const sheetId = VITE_PREVIOUS_AUDITS_SHEET_ID;
    const range = 'Sheet1!A1:F100';
    
    const values = await getFromGoogleSheet(sheetId, range);

    if (!values || values.length < 2) {
        return [];
    }
    const headers = ['date', 'summary', 'agentId', 'userEmail', 'timestamp', 'htmlOutput'];
    const dataRows = values.slice(1);

    const reports: PreviousAuditReport[] = dataRows.map(row => ({
        date: row[0] || '',
        summary: row[1] || '',
        agentId: row[2] || '',
        userEmail: row[3] || '',
        timestamp: row[4] || '',
        htmlOutput: row[5] || '',
    }));

    return reports; // Return all reports
};

// --- Google OAuth Service ---
export const postGoogleAuthCode = async (code: string): Promise<any> => {
    const response = await fetch(VITE_WEBHOOK_GOOGLE_OAUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
    });
    return handleResponse(response);
};

// --- Dashboard KPI Service ---
export const getDashboardKpis = async (): Promise<DashboardKpis | null> => {
    try {
        const kpis = await postJson(VITE_WEBHOOK_DASHBOARD_KPI, {});
        // Assuming the webhook returns data in the correct format
        return kpis;

    } catch (error) {
        console.error("Failed to fetch dashboard KPIs:", error);
        return null;
    }
};

// --- NEW DEEP RESEARCH AI SERVICES (Blueprint-Compliant) ---

export const startResearch = (payload: any) => apiPost('/api/research/start', payload);

export const getResearchStatus = (runId: string) => apiGet('/api/research/status', { runId });

const parseJsonArray = (jsonString: string): string[] => {
  if (!jsonString || typeof jsonString !== 'string') return [];
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    if (jsonString.includes(',')) {
      return jsonString.split(',').map(s => s.trim());
    }
    return [jsonString];
  }
};


export const fetchReportsForUser = async (email: string, page = 1, pageSize = 20, type = '', from = '', to = ''): Promise<{ reports: ResearchReport[], total: number, page: number, pageSize: number }> => {
    const sheetId = VITE_DEEP_RESEARCH_SHEET_ID;
    const range = 'ResearchReports!A1:Z100';
    
    const values = await getFromGoogleSheet(sheetId, range);

    if (!values || values.length < 2) {
        return { reports: [], total: 0, page: 1, pageSize: 20 };
    }

    const headers = values[0].map(h => h.trim());
    const dataRows = values.slice(1);

    const allReports: ResearchReport[] = dataRows.map((row): ResearchReport | null => {
        const reportObj: any = {};
        headers.forEach((header, index) => {
            reportObj[header] = row[index] || '';
        });
        
        if (!reportObj.user_id) return null;

        return {
            date: reportObj.date || '',
            agent_id: reportObj.agent_id || 'competitor_analysis',
            user_id: reportObj.user_id || '',
            timestamp: reportObj.timestamp || new Date().toISOString(),
            snippet: reportObj.snippet,
            short_summary: reportObj.short_summary,
            potential_focus_keyword: reportObj.potential_focus_keyword,
            relevant_long_tail_keywords: parseJsonArray(reportObj.relevant_long_tail_keywords),
            unigrams: parseJsonArray(reportObj.unigrams),
            bigrams: parseJsonArray(reportObj.bigrams),
            trigrams: parseJsonArray(reportObj.trigrams),
            runId: reportObj.runId || '',
            requestId: reportObj.requestId || '',
            status: reportObj.status || 'done',
            durationSeconds: reportObj.durationSeconds ? Number(reportObj.durationSeconds) : undefined,
            content_filter_status: reportObj.content_filter_status,
            html_output: reportObj.html_output,
            html_output_url: reportObj.html_output_url,
            tone: reportObj.tone,
            style: reportObj.style,
            crawl_depth: reportObj.crawl_depth ? Number(reportObj.crawl_depth) : undefined,
            fetch_faqs: reportObj.fetch_faqs === 'true' || reportObj.fetch_faqs === true,
            region: reportObj.region,
            device: reportObj.device,
            agent_meta: reportObj.agent_meta ? JSON.parse(reportObj.agent_meta) : undefined,
        } as ResearchReport;
    }).filter((report): report is ResearchReport => report !== null && report.user_id === email);

    let filteredReports = allReports;
    if (type) {
        filteredReports = filteredReports.filter(r => r.agent_id === type);
    }
    
    const total = filteredReports.length;
    const paginatedReports = filteredReports.slice((page - 1) * pageSize, page * pageSize);

    return { reports: paginatedReports, total, page, pageSize };
};


export const rerunReport = (requestId: string, userEmail: string) => apiPost('/api/research/rerun', { requestId, userEmail });

export const exportReports = (requestIds: string[], format: 'pdf' | 'html' | 'csv') => apiPost('/api/reports/export', { requestIds, format });

export const escalateReport = (requestId: string, reason: string) => apiPost('/api/report/escalate', { requestId, reason });


// --- FINAL BLUEPRINT Web AI Assistant Services ---
export const saveWebAIConfig = (payload: WebAIConfigPayload): Promise<WebAIConfigResponse> => {
    const blueprintPayload = {
        botName: payload.assistantName,
        tone: payload.tone,
        style: payload.style,
        confidenceThreshold: payload.autoEscalateConfidenceThreshold,
        ownerEmail: payload.ownerEmail
    };
    return postJson(VITE_WEBHOOK_WEB_AI_CONFIG, blueprintPayload);
};

export const submitWebAITraining = (payload: WebAITrainingPayload): Promise<{ status: string, trainedExamples: number }> => {
    const blueprintPayload = {
        botName: "Web Assistant",
        examples: payload.rows.map(row => ({
            question: row.userMessage,
            answer: row.assistantReply
        }))
    };
    return postJson(VITE_WEBHOOK_WEB_AI_TRAIN, blueprintPayload);
};

// New function to add a training document via webhook, as per the new architecture.
export const addWebAITrainingDoc = (payload: any): Promise<WebAITrainingAckResponse> => {
    return postJson(VITE_WEBHOOK_WEB_AI_TRAIN, payload);
};

export const fetchWebAITrainingData = async (userEmail: string): Promise<any[]> => {
    const values = await getFromGoogleSheet(VITE_WEB_AI_TRAINING_DATA_SHEET_ID, 'Sheet1');
    if (!values) return [];
    // The existing sheet is denormalized, so we map it directly.
    const allDocs = mapSheetValuesToObjects<any>(values);
    return allDocs.filter(doc => doc.user_email === userEmail);
};

export const requestEmbedCode = (email: string): Promise<WebAIEmbedData> => postJson(VITE_WEBHOOK_EMBED_REQUEST, { email });

export const fetchWebAIAnalytics = (from: string, to: string): Promise<WebAIAnalyticsData> => getJson(VITE_WEBHOOK_WEB_AI_ANALYTICS, { from, to });

export const fetchWebAILogs = async (from: string, to: string): Promise<WebAILogEntry[]> => {
    // FIX: Switched to direct Google Sheets API call to fix data fetching issue for logs and analytics.
    // This is a temporary solution; a server-side proxy is recommended for production.
    // Using 'Sheet1' as per user's diagnostic snippet, but blueprint suggests 'WebsiteAssistant'.
    // Using 11 columns (A:K) as per blueprint schema.
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${VITE_WEB_AI_SHEET_ID}/values/Sheet1!A1:K1000?key=${VITE_GOOGLE_API_KEY}`;
    
    let data;
    try {
        const res = await fetch(url);
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`Failed to fetch logs from Google Sheets: ${res.status} ${text}`);
        }
        data = await res.json();
    } catch (e) {
        console.error("Error fetching Web AI Logs:", e);
        throw e; // re-throw to be caught by the component
    }

    if (!data || !data.values || data.values.length < 2) {
        console.warn("No valid data returned from Google Sheets for Web AI Logs.");
        return [];
    }
    
    const headers = data.values[0] as string[];
    const headerMap: { [key: string]: number } = {};
    headers.forEach((h, i) => headerMap[h] = i);

    const logs: WebAILogEntry[] = data.values.slice(1).map((row: any[]) => ({
        "Timestamp": row[headerMap["Timestamp"]],
        "Customer Name": row[headerMap["Customer Name"]],
        "Customer Email": row[headerMap["Customer Email"]],
        "Bot Name": row[headerMap["Bot Name"]],
        "User Message": row[headerMap["User Message"]],
        "Bot Reply": row[headerMap["Bot Reply"]],
        "Intent/Category": row[headerMap["Intent/Category"]],
        "Meeting Date": row[headerMap["Meeting Date"]],
        "Meeting Topic": row[headerMap["Meeting Topic"]],
        "Ticket Status": row[headerMap["Ticket Status"]],
        "Escalation/Notes": row[headerMap["Escalation/Notes"]],
    }));

    // Perform date filtering on the client side
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setDate(toDate.getDate() + 1); // include the whole 'to' day

    return logs.filter(log => {
        const logDate = new Date(log.Timestamp);
        return logDate >= fromDate && logDate < toDate;
    });
};

export const getTodaysWebAIConversations = async (): Promise<WebAIHistoryItem[]> => {
    const to = new Date();
    // FIX: Use native Date for date subtraction.
    const from = new Date(to);
    from.setDate(from.getDate() - 1);
    const fromStr = format(from, 'yyyy-MM-dd');
    const toStr = format(to, 'yyyy-MM-dd');
    return fetchWebAILogs(fromStr, toStr);
};

export const postWebAIMessage = (payload: { sessionId: string; idempotencyKey: string; message: string; assistantName: string; }): Promise<{ aiResponse: string }> => {
    return postJson(VITE_WEBHOOK_WEB_AI_SEARCH, payload);
};

// --- UNIFIED TRAINING DASHBOARD SERVICES ---
export const fetchUnifiedTrainingData = async (userEmail: string): Promise<UnifiedTrainingDoc[]> => {
    const values = await getFromGoogleSheet(VITE_WEB_AI_TRAINING_DATA_SHEET_ID, 'Sheet1');
    if (!values) return [];
    // The sheet data is denormalized, so we need to map headers correctly.
    if (values.length < 2) return [];
    const headers = values[0].map(h => h.trim());
    return values.slice(1).map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || '';
        });
        return obj as UnifiedTrainingDoc;
    }).filter(doc => doc.user_email === userEmail);
};

export const addUnifiedTrainingDoc = (payload: any): Promise<AddTrainingDocResponse> => {
    // The user specified the webhook for training is the one for support AI
    return postJson(VITE_WEBHOOK_SUPPORT_AI_TRAIN, payload);
};

export const addResponseAiTemplate = (payload: any): Promise<AddTrainingDocResponse> => {
    return postJson(VITE_WEBHOOK_TRAIN_REPLIER, payload);
};


// --- Dashboard Stats Functions ---
export const getSalesInboxStats = async (): Promise<SalesInboxStats | null> => {
    const values = await getFromGoogleSheet(VITE_SHEET_ID, 'Dashboard!A1:B4');
    if (!values) return null;
    const stats: any = {};
    values.forEach(row => {
        if(row[0] === 'Emails Processed') stats.emails_processed = parseInt(row[1] || '0', 10);
        if(row[0] === 'Opportunities Found') stats.opportunities_found = parseInt(row[1] || '0', 10);
        if(row[0] === 'Needs Approval') stats.needs_approval = parseInt(row[1] || '0', 10);
    });
    return stats;
}

export const getSalesMeetingStats = async (): Promise<SalesMeetingStats | null> => {
    const values = await getFromGoogleSheet(VITE_SHEET_ID, 'Dashboard!D1:E4');
    if (!values) return null;
    const stats: any = {};
    values.forEach(row => {
        if(row[0] === 'Meetings Today') stats.meetings_today = parseInt(row[1] || '0', 10);
        if(row[0] === 'Pending Meetings') stats.pending_meetings = parseInt(row[1] || '0', 10);
        if(row[0] === 'Potential Value') stats.potential_value = parseInt(row[1] || '0', 10);
    });
    return stats;
}

export const getSalesPendingApprovals = async (): Promise<SalesPendingApproval[]> => {
    const values = await getFromGoogleSheet(VITE_SHEET_ID, 'Pending!A1:C10');
    if (!values || values.length < 2) return [];
    const headers = values[0];
    return values.slice(1).map(row => ({
        company: row[headers.indexOf('Company')],
        deal_value: row[headers.indexOf('Deal Value')] ? parseInt(row[headers.indexOf('Deal Value')], 10) : undefined,
        meeting_time: row[headers.indexOf('Meeting Time')],
        purpose: row[headers.indexOf('Purpose')]
    }));
}

export const getSupportStats = async (): Promise<SupportStats | null> => {
    const values = await getFromGoogleSheet(VITE_SUPPORT_SHEET_ID, 'Dashboard!A1:B5');
    if (!values) return null;
    const stats: any = {};
    values.forEach(row => {
        if(row[0] === 'Conversations') stats.conversations = parseInt(row[1] || '0', 10);
        if(row[0] === 'Auto-Resolved') stats.autoResolved = parseInt(row[1] || '0', 10);
        if(row[0] === 'Escalated') stats.escalated = parseInt(row[1] || '0', 10);
        if(row[0] === 'Satisfaction') stats.satisfaction = parseFloat(row[1] || '0');
    });
    return stats;
}

export const getSupportPerformanceTrends = async (): Promise<SupportPerformanceTrend[]> => {
    const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${VITE_PERFORMANCE_TRENDS_SHEET_ID}/values/Trends!A1:D100?key=${VITE_GOOGLE_API_KEY}`;
    const res = await fetch(sheetUrl);
    if(!res.ok) return [];
    const data = await res.json();
    if(!data.values || data.values.length < 2) return [];
    const headers = data.values[0];
    return data.values.slice(1).map((row: any) => ({
        date: row[headers.indexOf('Date')],
        conversations: parseInt(row[headers.indexOf('Conversations')] || '0', 10),
        resolved_pct: parseFloat(row[headers.indexOf('Resolved Pct')] || '0'),
        satisfaction: parseFloat(row[headers.indexOf('Satisfaction')] || '0'),
    }));
}

export const getLeadGenCampaignPerformance = async (): Promise<LeadGenCampaignPerformance | null> => {
     const values = await getFromGoogleSheet(VITE_LEADGEN_SHEET_ID, 'Dashboard!A1:B2');
     if(!values) return null;
     let responseRate = '0%';
     values.forEach(row => {
        if(row[0] === 'Response Rate') responseRate = row[1];
     });
     return { responseRate };
}

// --- Core Services Dashboard Data ---
export const fetchCoreServiceData = (sheetId: string, range: string, userEmail: string) => 
    getFromGoogleSheet(sheetId, range)
        .then(values => {
            if (!values || values.length < 2) return [];
            const headers = values[0].map(h => h.trim().toLowerCase());
            const emailIndex = headers.indexOf('user_email');
            if (emailIndex === -1) return []; // Cannot filter by user

            return values.slice(1)
                .filter(row => row[emailIndex] === userEmail)
                .map(row => {
                    const obj: any = {};
                    headers.forEach((header, index) => {
                        obj[header] = row[index] || '';
                    });
                    return obj;
                });
        });

// --- CRM ---
export const fetchCRMEvents = (payload: CRMCredentialsPayload): Promise<CRMEvent[]> => postJson(VITE_WEBHOOK_CRM_FETCH_EVENTS, payload);
export const saveCRMCredentials = (payload: CRMCredentialsPayload): Promise<any> => postJson(VITE_WEBHOOK_CRM_SAVE_CREDS, payload);

// --- Influencer Research ---
export const submitInfluencerResearch = (payload: InfluencerResearchRequest): Promise<InfluencerResearchResponse> => postJson(VITE_WEBHOOK_INFLUENCER_RESEARCH, payload);

// --- Custom Solution ---
export const submitCustomSolution = (payload: CustomSolutionPayload): Promise<any> => postJson(VITE_WEBHOOK_CUSTOM_SOLUTION, payload);

// --- Training ---
export const trainSupportAI = (payload: SupportAITrainingPayload) => postJson(VITE_WEBHOOK_SUPPORT_AI_TRAIN, payload);
export const trainSalesAI = (payload: SalesAITrainingPayload) => postJson(VITE_WEBHOOK_SALES_AI_TRAIN, payload);

// --- Knowledge Base ---
export const getKnowledgeBaseAnswer = (query: string): Promise<{ output: string }> => postJson(VITE_WEBHOOK_KNOWLEDGE_BASE, { query });

// --- AI Assistant ---
export const chatWithAIAssistant = (message: string): Promise<{ output: string }> => postJson(VITE_WEBHOOK_AI_ASSISTANT, { message });

// --- Contact Form ---
export const submitContactForm = (payload: ContactFormPayload): Promise<any> => postJson(VITE_WEBHOOK_CONTACT_FORM, payload);

// --- Chat Command ---
export const runChatCommand = (payload: ChatCommandPayload): Promise<any> => postJson(VITE_WEBHOOK_LEAD_RESEARCH_AI_CHAT, payload);

// --- Microservices ---
export const submitAIStrategyAnalysis = async (payload: AIStrategyFormData): Promise<{ html: string }> => {
    const response = await postJson(VITE_WEBHOOK_AI_STRATEGY_CALL, payload);
    if (Array.isArray(response) && response.length > 0 && response[0].html) {
        return response[0];
    }
    if (response && response.html) {
        return response;
    }

    throw new Error("Invalid response from AI Strategy Analysis service.");
};

export const fetchAIStrategySlots = async (): Promise<{ day: string, times: string[] }[]> => {
    return getJson(VITE_WEBHOOK_AI_STRATEGY_SLOTS);
};

export const generateWebsiteReport = async (payload: WebsiteReportRequest): Promise<WebsiteReportHtmlResponse[]> => {
    // Set a long timeout (30 minutes) as the user requested to wait for the response.
    const response = await postJson(VITE_WEBHOOK_WEBSITE_REPORT, payload, 1800000);

    // Helper to find the HTML report inside various possible structures
    const findReport = (data: any): WebsiteReportHtmlResponse[] | null => {
        if (!data) return null;

        // Case 1: The data is the expected array `[{html: '...'}]`
        if (Array.isArray(data) && data.length > 0 && typeof data[0]?.html === 'string') {
            return data;
        }

        // Case 2: The data is a single report object `{html: '...'}`
        if (typeof data === 'object' && !Array.isArray(data) && typeof (data as any).html === 'string') {
            return [data as WebsiteReportHtmlResponse];
        }

        // Case 3: n8n wraps the output in an array: `[ { json: ... } ]` or `[ { data: ... } ]`
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
            const nestedData = data[0].json || data[0].data;
            if (nestedData) {
                // The nested data might be a stringified JSON, so we try to parse it
                if (typeof nestedData === 'string') {
                    try {
                        return findReport(JSON.parse(nestedData));
                    } catch (e) {
                        return null; // It was a string but not JSON
                    }
                }
                return findReport(nestedData);
            }
        }

        return null;
    }

    const report = findReport(response);

    if (report) {
        return report;
    }
    
    throw new Error('Invalid report format received from the server. Expected an array with an HTML report.');
};

export const fetchWebsiteReportHistory = async (): Promise<WebsiteReportHistoryItem[]> => {
    const url = 'https://sheets.googleapis.com/v4/spreadsheets/1s5B117UkG8r0piVoCztXYfafHFj1VOhiqvJKnr7L12w/values/Sheet1?key=AIzaSyA4XlhMDF3Ft4eLzIf1K1B_mNB9cxSbpB0';

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch report history: ${response.statusText}`);
        }
        const data: GoogleSheetsValuesResponse = await response.json();

        if (!data.values || data.values.length < 2) {
            return [];
        }

        const headerIndex = data.values.findIndex(row => row.includes('requestId') && row.includes('siteUrl'));
        if (headerIndex === -1) {
            console.warn("Could not find a valid header row in the report history sheet.");
            return [];
        }

        const headers = data.values[headerIndex].map(h => h.trim());
        const dataRows = data.values.slice(headerIndex + 1);

        const historyItems: WebsiteReportHistoryItem[] = dataRows
            .map(row => {
                const item: any = {};
                headers.forEach((header, index) => {
                    item[header] = row[index] || '';
                });
                return item as WebsiteReportHistoryItem;
            })
            .filter(item => item.siteUrl && item.date && item.html_output); // Filter out empty or invalid rows

        return historyItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
        console.error("Error fetching website report history:", error);
        throw error;
    }
};

export const rewriteEmail = (payload: EmailRewriteInitialRequest): Promise<EmailRewriteInitialResponse> => postJson(VITE_WEBHOOK_AI_EMAIL_REWRITE, payload);
export const getJobStatus = <T,>(jobId: string): Promise<JobStatusResponse<T>> => getJson(VITE_WEBHOOK_JOB_STATUS, { job_id: jobId });

// --- 5-Day AI Business Simulator (NEW) ---
export const createSimJob = (payload: any): Promise<{ job_id: string, sim_sheet_url: string, created_at: string }> => {
    return postWithTimeout(VITE_WEBHOOK_SIMULATOR_CREATE, payload);
};

export const runSimDay = (payload: any): Promise<SimulatorDayResponse> => {
    return postWithTimeout(VITE_WEBHOOK_SIMULATOR_DAY, payload);
};

export const getSimulatorsSheet = (jobId: string): Promise<{values: any[][]}> => {
    return getJson(VITE_WEBHOOK_SIMULATOR_GET_SHEET, { range: 'Simulators!A1:Z1000' });
};


// --- Email Templates ---
export const getEmailTemplates = async (userEmail: string): Promise<EmailTemplate[]> => {
    const values = await getFromGoogleSheet(VITE_EMAIL_TEMPLATES_SHEET_ID, 'Sheet1!A1:F100');
    if (!values || values.length < 2) return [];
    const headers = values[0];
    return values.slice(1).map(row => ({
        id: row[headers.indexOf('id')],
        name: row[headers.indexOf('name')],
        subject: row[headers.indexOf('subject')],
        body: row[headers.indexOf('body')],
        createdAt: row[headers.indexOf('createdAt')],
        userEmail: row[headers.indexOf('userEmail')],
    })).filter(t => t.userEmail === userEmail);
};
export const saveEmailTemplate = (payload: Partial<EmailTemplate>) => postJson(`${VITE_WEBHOOK_EMAIL_TEMPLATES}`, { action: payload.id ? 'update' : 'create', ...payload });
export const deleteEmailTemplate = (id: string, userEmail: string) => postJson(`${VITE_WEBHOOK_EMAIL_TEMPLATES}`, { action: 'delete', id, userEmail });

// --- Lead Gen ---
export const fetchLeads = async (page = 1, pageSize = 20, filter: string): Promise<{ leads: Lead[], total: number }> => {
    const values = await getFromGoogleSheet(VITE_RESEARCH_SHEET_ID, 'LeadDataMaster!A1:Z');
    if (!values || values.length < 2) return { leads: [], total: 0 };
    const headers = values[0];
    const allRows = values.slice(1).map((row, index) => {
        const leadObj: any = { rowNumber: index + 2 };
        headers.forEach((h, i) => leadObj[h] = row[i]);
        return computeLeadFields(leadObj);
    });
    // Add client-side filtering if needed, for now just returning all for simplicity
    return { leads: allRows, total: allRows.length };
};

export const startHunt = (payload: any): Promise<ScrapeResponse> => postJson(VITE_WEBHOOK_LEAD_HUNT, payload);
export const appendMany = (payload: { userEmail: string; runId: string; leads: RawLead[] }) => postJson(VITE_WEBHOOK_LEADS_APPEND, payload);
export const researchLead = (payload: any): Promise<{ researchReportHtml: string }> => postJson(VITE_WEBHOOK_LEAD_RESEARCH, payload);
export const updateLeadRowStatus = (rowNumber: number, updates: any) => postJson(VITE_WEBHOOK_LEAD_UPDATE_STATUS, { rowNumber, ...updates });
export const getOutreachStatus = (campaignId: string) => getJson(VITE_WEBHOOK_OUTREACH_STATUS, { campaignId });
export const scheduleOutreach = (payload: any): Promise<{ scheduled: number, campaignId: string }> => postJson(VITE_WEBHOOK_OUTREACH_SCHEDULE, payload);
export const scheduleUniversalPersonalization = (payload: any) => postJson(VITE_WEBHOOK_EMAIL_PERSONALIZE_UNIVERSAL_SCHEDULE, payload);