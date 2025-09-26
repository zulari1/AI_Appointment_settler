// FIX: Import React to use React.ReactNode type.
import React from 'react';

// --- New Research AI Types (Blueprint-Compliant) ---
export type ResearchReport = {
  date: string; // YYYY-MM-DD
  agent_id: 'competitor_analysis'|'website_audit'|'keyword_research';
  user_id: string; // email
  timestamp: string; // ISO
  snippet?: string;
  short_summary?: string;
  potential_focus_keyword?: string;
  relevant_long_tail_keywords: string[]; 
  unigrams: string[];
  bigrams: string[];
  trigrams: string[];
  runId: string;
  requestId: string;
  status: 'done'|'processing'|'error' | 'queued';
  durationSeconds?: number;
  content_filter_status?: 'safe'|'flagged';
  html_output?: string; // raw html (optional)
  html_output_url?: string; // preferred
  tone?: string;
  style?: string;
  crawl_depth?: number;
  fetch_faqs?: boolean;
  region?: string;
  device?: string;
  agent_meta?: any; // extra structured stuff
};


// FIX: Define missing LeadGenCampaignPerformance interface.
export interface LeadGenCampaignPerformance {
    responseRate: string;
}

// --- FINAL BLUEPRINT: Web AI Assistant Types (Updated as per new blueprint) ---

export interface WebAIConversationLog {
  Timestamp: string;
  customer_name: string;
  customer_email: string;
  bot_name: string;
  session_id: string;
  user_message: string;
  bot_reply_text: string;
  intent: string;
  meeting_date?: string;
  meeting_topic?: string;
  ticket_status?: string;
  escalation_notes?: string;
  bot_latency_ms?: string;
  message_type?: 'user' | 'bot' | 'system';
}

// Alias for backwards compatibility where needed
export type WebAIHistoryItem = WebAIConversationLog;

export interface WebAIDeployment {
    user_email: string;
    bot_name: string;
    embed_id: string;
    embed_url: string;
    embed_snippet: string;
    domain_allowed: string;
    issued_at: string;
    issued_by: string;
    status: 'Active' | 'Revoked' | 'Pending';
    last_used_at: string;
    instructions_link: string;
    notes: string;
}

export interface WebAIBotConfig {
    bot_name: string;
    user_email_owner: string;
    default_response_style: 'concise' | 'sales' | 'friendly' | 'formal' | 'casual' | 'empathetic' | 'professional';
    escalation_rules_json: string;
    calendar_connected: 'TRUE' | 'FALSE';
    email_connected: 'TRUE' | 'FALSE';
    training_sheet_url: string;
    active_domains_csv: string;
    created_at: string;
    updated_at: string;
}

// Payload for the settings form, as per the new blueprint
export interface WebAISettingsPayload {
  tone: 'formal' | 'casual' | 'empathetic' | 'professional';
  escalation_rules: string;
  greeting: string;
  fallback: string;
  booking_enabled: boolean;
  user_email: string;
}


export interface WebAIConfigResponse {
  status: "ok" | "error" | "success";
  settingsId?: string;
  message?: string;
}

export interface WebAITrainingRow {
  sampleId: string;
  userMessage: string;
  assistantReply: string;
  intent: string;
}

export interface WebAITrainingPayload {
  idempotencyKey: string;
  ownerEmail: string;
  datasetName: string;
  consentGiven: boolean;
  rows: WebAITrainingRow[];
}

export interface WebAITrainingResponse {
  status: "queued" | "error";
  runId?: string;
  qualityScore?: number;
  message?: string;
}

export interface WebAIAnalyticsData {
    conversations: number;
    uniqueUsers: number;
    bookingsCreated: number;
    bookingRate: number;
    escalations: number;
    avgResponseMs: number | null;
}

export interface WebAIEmbedData {
    status: "ok";
    embed_id: string;
    embed_url: string;
    embed_snippet: string;
    expires_at: string;
}

// Updated WebAITrainingDoc to match the new 'Training' sheet schema.
export interface WebAITrainingDoc {
  user_email: string;
  agent_name: 'Research AI' | 'Sales AI' | 'Support AI' | 'Lead Gen' | 'Web AI';
  doc_id: string;
  doc_name: string;
  doc_type: 'Company DNA' | 'Product Data' | 'FAQ' | 'Meeting Info' | 'Personality' | 'Other' | 'Policy' | 'SOP' | 'Chat Scripts' | 'Pricing Guide' | 'Case Study' | 'Objection Handling' | 'Meeting Templates';
  doc_status: 'Empty' | 'Partial' | 'Complete';
  file_url?: string;
  uploaded_at: string;
  last_updated: string;
  text_preview?: string;
  doc_size?: number; // bytes or word count
  doc_source?: string; // ui_upload, web_import, url_import
  notes?: string;
}

// New type for the 'AgentsSummary' sheet, separating agent-level data.
export interface WebAIAgentSummary {
  user_email: string;
  agent_name: 'Web AI'; // Focused on Web AI for this page
  docs_count: number;
  agent_iq: number;
  last_updated: string;
  // Denormalized fields for UI convenience
  runs_count: number;
  last_summary: string;
  revenue_share_percent: number;
  revenue_value: number;
}

// Type for the response from the add document webhook
export type WebAITrainingAckResponse = {
  status: "Successfull"; // Note spelling from user spec
  email: string;
}[];

// --- UNIFIED TRAINING DASHBOARD TYPES ---
export interface UnifiedTrainingDoc {
  user_email: string;
  agent_name: string;
  agent_iq: string; // e.g., "23%"
  doc_id: string;
  doc_name: string;
  doc_type: string;
  doc_status: 'Empty' | 'Partial' | 'Complete';
  uploaded_date: string;
  last_updated: string;
  runs_count: string;
  last_summary: string;
  revenue_share_percent: string; // e.g., "18%"
  revenue_value: string; // e.g., "$2,118"
}

export type AddTrainingDocResponse = {
  status: string; // "Successfull"
  email: string;
}[];


// --- End Web AI Assistant Types ---


export interface WebAIKnowledgeSearchQuery {
    email: string;
    query: string;
}


// --- New Customer Support AI Types (Blueprint-Compliant) ---

export type Status = 'New' | 'In Progress' | 'Escalated' | 'Complete' | 'Human Review' | string;
export type Filter = 'today' | 'pending' | 'escalated' | 'completed' | 'all';

// FIX: Add missing support types.
export interface SupportStats {
  conversations: number;
  autoResolved: number;
  escalated: number;
  satisfaction: number;
}

export interface SupportPerformanceTrend {
  date: string;
  conversations: number;
  resolved_pct: number;
  satisfaction: number;
}

export interface SupportConversation {
  id: string;
  customerName: string;
  topic: string;
  status: 'review' | 'resolved';
}

export interface SupportSettings {
  autoReply: boolean;
  reviewMode: boolean;
  languages: string[];
}

export interface SupportSettingsPayload extends SupportSettings {
  email: string;
}

// Using a flexible type to accommodate different training payloads.
export interface SupportAITrainingPayload {
  email: string;
  [key: string]: any;
}

export interface SupportRow {
    [key: string]: any;
    rowNumber: number;
    Timestamp: string;
    "Customer Name": string;
    "Customer Email Address": string;
    "Contact ID": string;
    "Thread ID": string;
    "Message ID": string;
    "Inquiry Topic": string;
    "Inquiry Body": string;
    "Thread Summary"?: string;
    "CRM Notes"?: string;
    Status: Status;
    "Escalation Flag": "TRUE" | "FALSE" | "Yes" | "No" | "";
    "Approval Status"?: string;
    "Draft Email Body": string;
    Reasoning?: string;
    "Processed At"?: string;
    Outcome?: string;
    ProcessingDuration?: string;
}

// Types for the new Support AI Training Dashboard
export interface SupportChaosMetrics {
    unread_emails: number;
    pending_chats: number;
    avg_response_time: number; // in hours
    after_hours_count: number;
    latest_complaint_preview: string;
    potential_auto_responses: number; // percentage
}

export interface SupportPerformanceMetrics {
    responses_today: number;
    whatsapp_responses: number;
    escalations_today: number;
    avg_response_time: number; // in seconds
    csat_avg: number;
    time_saved_hours: number;
    improvement_pct: number;
}

export interface EscalationRules {
    auto: string[];
    manual: string[];
}


export interface KnowledgeBaseStats {
  documentCount: number;
}

// --- New Sales AI Agent Types (Blueprint-Compliant) ---
export type SalesFilter = 'TODAY' | 'PENDING' | 'BOOKING' | 'ALL';

export interface SalesRow {
  rowNumber: number;
  Timestamp: string;
  "Customer Name": string;
  "Customer Email": string;
  "Contact ID": string;
  "Thread ID": string;
  "Message ID": string;
  "Email Type": 'Booking' | 'Info' | string;
  "Inquiry Topic": string;
  "Inquiry Body": string;
  Status: 'Pending' | 'Resolved' | 'Escalated' | string;
  Escalation: 'Yes' | 'No' | string;
  Approval: 'Yes' | 'No' | string;
  "Draft Email": string;
  Reasoning: string;
  "Processed At": string;
  Outcome: string;
  "Meeting Booked": 'Yes' | 'No' | string;
  "Meeting Date": string;
  "Meeting Time": string;
  "Meeting Link": string;
  Attendees: string;
  // Derived fields
  submitted?: Date | null;
  processedAt?: Date | null;
  meetingDate?: Date | null;
  timeAgoMinutes?: number | null;
  meetingBooked?: boolean;
  isEscalated?: boolean;
  isApproved?: boolean;
  dateOnly?: string;
}

export interface SalesKpis {
  conversationsToday: number;
  meetingsBooked: number;
  escalations: number;
  bookingRate: number;
}

export interface SalesEscalationRules {
    auto: string[];
    manual: string[];
}


// --- Old Sales AI Types (to be deprecated) ---
export interface SalesInboxStats {
  emails_processed: number;
  opportunities_found: number;

  needs_approval: number;
}

export interface SalesMeetingStats {
  meetings_today: number;
  pending_meetings: number;
  potential_value: number;
}

export interface SalesPendingApproval {
  company: string;
  deal_value?: number;
  meeting_time: string;
  purpose?: string;
}

export interface SalesPipelineMetrics {
  active_prospects: number;
  pipeline_value: number;
  close_rate: number;
}

export interface SalesMaterials {
  proposals: number;
  pricing_sheets: number;
  case_studies: number;
}

export interface SalesAITrainingPayload {
  email: string;
  type: 'url' | 'text';
  content: string; // can be text, URL, or base64 file content
  fileName?: string;
  mimeType?: string;
  serviceType?: string;
}

// --- Dashboard KPI Types ---
export interface KpiMetric {
  value: number;
  trend: string;
}

export interface DashboardKpis {
  conversations: KpiMetric;
  meetings: KpiMetric;
  leads: KpiMetric;
  pipeline: KpiMetric;
}

// --- Lead Generation System Types (as per new PRD) ---
export interface Lead {
    rowNumber?: number;
    'Date'?: string;
    'First Name'?: string;
    'Last Name'?: string;
    'FullName': string;
    'Email Address': string;
    'Phone Number'?: string;
    'Country'?: string;
    'Location'?: string;
    'Industry'?: string;
    'Company Name'?: string;
    'Job Title'?: string;
    'Seniority'?: string;
    'Website URL'?: string;
    'LinkedIn URL'?: string;
    'Analysed'?: 'YES' | 'NO' | 'PENDING' | '';
    'Research Report'?: string;
    'Email#1 Body'?: string;
    'Email#1 Subject'?: string;
    'Email #2 Body'?: string; // Note space in key
    'Email#3 Body'?: string;
    'Email#3 Subject'?: string;
    'Sender Email'?: string;
    'Time Zone'?: string;
    'Email#1 Sent'?: 'YES' | 'NO' | '' | 'QUEUED';
    'Email#2 Sent'?: 'YES' | 'NO' | '';
    'Email#3 Sent'?: 'YES' | 'NO' | '';
    'Message ID'?: string;
    'Replied'?: 'YES' | 'NO' | '';
    'Token'?: string;
    'Opted Out'?: 'YES' | 'NO' | '';

    // --- COMPUTED / ALIASED FIELDS ---
    id: string; // unique identifier (can be rowNumber or email)
    
    // Aliases for easier dot notation access
    displayName: string;
    email: string;
    company: string;
    title: string;
    location: string;
    country: string;
    industry: string;
    websiteUrl: string;
    linkedinUrl: string;
    researchReportHtml: string;
    
    // Computed booleans
    analyzedBool: boolean;
    repliedBool: boolean;
    hasReport: boolean;

    // Computed statuses and scores
    outreachStatus: string;
    emailsCraftedCount: number;
    emailsSentCount: number;
    sentCount: number; // alias for emailsSentCount
    priorityScore: number;
    qualityScore: number; // alias for priorityScore
    progressStep: string;
    freshnessDays: number;
}


export interface ScrapeResponseOk {
    status: "ok";
    runId: string;
    stats: { found: number; new: number; duplicates: number; verifiedEmails?: number };
    leads: {
      fullName?: string;
      email: string;
      jobTitle?: string;
      company?: string;
      linkedin?: string;
      website?: string;
    }[];
}

export interface ScrapeResponseQueued {
    status: "queued";
    runId: string;
    estimatedSeconds: number;
}

export interface ScrapeResponseError {
    status: "error";
    message: string;
}

export type ScrapeResponse = ScrapeResponseOk | ScrapeResponseQueued | ScrapeResponseError;

// FIX: Define missing RawLead and MappedLeadForSheet types for lead generation.
export interface RawLead {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    seniority?: string;
    website?: string;
    linkedin?: string;
    country?: string;
    location?: string;
    category?: string;
    source?: string;
}

export interface MappedLeadForSheet {
    "First Name": string;
    "Last Name": string;
    "Full Name": string;
    "Email Address": string;
    "Phone Number": string;
    "Company Name": string;
    "Job Title": string;
    "Seniority": string;
    "Website URL": string;
    "LinkedIn URL": string;
    "Country": string;
    "Location": string;
    "Category": string;
    "Source": string;
    "Analysed": string;
    "Research Report": string;
    "Time Added": string;
}


export interface ResearchDoc {
  profileImage?: string;
  companyLogo?: string;
  analysisHtml?: string;     // sanitized
  profileHtml?: string;
  educationHtml?: string;
  experienceHtml?: string;
  postsHtml?: string;
  googleHtml?: string;
  citationsHtml?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
  isLoading?: boolean;
}

export interface AgentSettings {
    [key: string]: any;
}

export interface AgentSettingsPayload {
    userEmail: string;
    agentName: string;
    settings: AgentSettings;
}

// Command-based Chat Types
export interface ChatCommandLead {
  name: string;
  email: string;
  linkedin?: string;
  company?: string;
  title?: string;
  location?: string;
  researchSummary?: string;
}

export interface ChatCommandPayload {
  action: 'command';
  command: 'summary' | 'score';
  userEmail: string;
  sessionId?: string;
  lead: ChatCommandLead;
  timestamp?: string;
}

// FIX: Define missing ChatSummaryContact interface.
export interface ChatSummaryContact {
    name?: string;
    title?: string;
    company?: string;
    email?: string;
    linkedin?: string;
    website?: string;
}

export interface ChatSummaryItem {
  summary: string;
  bullets: string[];
  contact: ChatSummaryContact;
}

export type ChatSummaryResponse = ChatSummaryItem[];

export interface ChatScoreItem {
  rowNumber?: number;
  name: string;
  company: string;
  title: string;
  email: string;
  linkedin: string;
  score: number;
  scoreBreakdown: {
    roleMatch?: number;
    contactQ?: number;
    companyQ?: number;
    seniority?: number;
    researchDepth?: number;
    engagement?: number;
  };
  strengths: string[];
  weaknesses: string[];
  disqualifiers: string[];
  recommendation: string;
  confidencePercent: number;
  rawRow?: any;
}

export type ChatScoreResponse = ChatScoreItem[];


// --- Custom Solution Builder ---
export interface CustomSolutionStakeholder {
  name: string;
  influence: number;
  concern: string;
}

export interface CustomSolutionMetric {
  name: string;
  current: string;
  target: string;
}

export interface CustomSolutionFormData {
  // Onboarding
  firstName: string;
  email: string;
  company: string;
  // Step 1: Objective
  primaryObjective: string;
  specificGoal: string;
  // Step 2: Pain Points
  primaryChallenge: string;
  impactDescription: string;
  painIntensity: number;
  urgency: 'critical' | 'important' | 'moderate';
  // Step 3: Tech Stack
  techStack: { name: string; status: 'integrable' | 'complex' | 'api' }[];
  customTools: string;
  // Step 4: Resources
  teamSize: string;
  techLevel: number;
  manager: 'me' | 'team' | 'hire';
  budget: number;
  timeline: string;
  // Step 5: Success Metrics
  metrics: CustomSolutionMetric[];
  riskTolerance: number;
  // Step 6: Stakeholders
  decisionMaker: 'me' | 'manager' | 'committee' | 'team';
  stakeholders: CustomSolutionStakeholder[];
  approvalComplexity: 'simple' | 'standard' | 'complex';
  decisionTimeline: string;
  includePresentation: boolean;
}

export type CustomSolutionPayload = CustomSolutionFormData;


// Generic Google Sheets API response type
export interface GoogleSheetsValuesResponse {
  range: string;
  majorDimension: string;
  values: any[][];
}

// --- Integrations ---
export interface Integration {
  user_email: string;
  service_name: string;
  integration_type: 'Gmail' | 'Calendar';
  account_email: string;
  token_id: string;
  token_store_hint: string;
  status: 'Connected' | 'Disconnected' | 'Expired' | 'Error';
  scopes: string;
  connected_date: string;
  expires_at: string;
  last_verified: string;
  notes: string;
}


// --- CRM Automation Types ---
export type CRMPlatform = 'shopify' | 'woocommerce' | 'bigcommerce' | 'other';
export type CRMEventType = 'signup' | 'login' | 'abandoned_cart';

export interface CRMEvent {
  timestamp: string;
  customer_name: string;
  event: CRMEventType;
}

export interface CRMCredentialsPayload {
    platform: CRMPlatform;
    api_key: string;
    user_email: string;
}

// --- Contact Form ---
export interface ContactFormPayload {
    name: string;
    email: string;
    businessType: string;
    goal: string;
    challenge: string;
    message: string;
    agencyEmail?: string;
}

// --- Influencer Research Types ---
export interface InfluencerResearchRequest {
    username_or_url: string;
}

export interface InfluencerResearchResponse {
    username: string;
    profile_url: string;
    follower_count: number;
    engagement_rate: string;
    location: string;
    should_collaborate: boolean;
    reason: string;
    similar_influencers: {
        username: string;
        profile_url: string;
    }[];
}

// --- Microservices PRD Types ---

export interface JobStatusResponse<T> {
  job_id: string;
  service: string;
  status: "queued" | "running" | "completed" | "failed";
  progress?: number; // 0-100
  stage?: string;
  output?: T;
  error?: { code: string; message: string };
}

// --- AI Readiness Audit ---
export interface AiReadinessAuditRequest {
  // Step 1
  email: string;
  company: string;
  website: string;
  industry: string;
  companySize: string;
  businessModel: string;
  
  // Step 2
  primaryChallenge: string;
  problemDescription: string;
  secondaryChallenges: string[];
  
  // Step 3
  currentTools: string[];
  teamSizeInvolved: number;
  timeSpentWeekly: number;
  
  // Step 4
  metrics: {
    hoursSavedTarget?: number;
    revenueImpactTarget?: number;
    customerImpactTarget?: number;
    customKpi?: { name: string; current: string; target: string; }
  }

  // Step 5
  consentToCrawl: boolean;
  aiUsage: string;
  aiComfortLevel: number;
}


export interface AiReadinessAuditHtmlResponse {
    report_html: string;
}

export interface PreviousAuditReport {
    date: string;
    summary: string;
    agentId: string;
    userEmail: string;
    timestamp: string;
    htmlOutput: string;
}


// --- Mini Lead Gen Pack ---
export interface MiniLeadsForm {
  email: string;
  mode: "mini";
  quantity: 10 | 50;
  target: {
    industry: string;
    roles: string[];
    locations?: string[];
  };
  source_preferences?: string[];
  competitor_urls?: string[];
  clientNotes?: string;
  website?: string;
}

export interface LeadGenStartResponse {
  status: "queued";
  job_id: string;
  estimated_delivery?: string;
}

export interface LeadGenOutput {
  count: number;
  quality_score: number;
  leads_csv_url: string;
  sample_preview: Array<{ name: string; company: string; title: string; email_masked: string; linkedin?: string }>;
  top_segments?: Array<{ label: string; share: number }>;
  completed_at: string;
}

// --- Website Deep-Analyzer (Blueprint-Compliant) ---
export interface WebsiteReportRequest {
  requestId: string;
  userEmail: string;
  siteUrl: string;
  primaryProblem: string;
  region: string;
  depth: 'quick' | 'standard' | 'deep';
  priorityPages?: string[];
  sitemapUrl?: string;
  industry?: string;
  kpis?: { metric: string; current: number; target: number }[];
  competitors?: string[];
  reportStyle: 'exec_summary' | 'technical' | 'action_roadmap';
  budgetBand?: string;
  consent_crawl: boolean;
  auth?: { requiresAuth: boolean };
}

export interface WebsiteReportStartResponse {
  status: "queued";
  requestId: string;
  eta_seconds: number;
  job_id: string; 
}

export interface WebsiteReportHtmlResponse {
  html: string;
}

export interface WebsiteReportHistoryItem {
  date: string;
  requestId: string;
  user_email: string;
  siteUrl: string;
  agent_id: string;
  short_summary: string;
  score: string;
  report_type: string;
  timestamp: string;
  html_output: string;
  json_link: string;
  status: string;
}

export interface WebsiteReportResult {
  meta: {
    requestId: string;
    siteUrl:string;
    generatedAt:string;
    score: number;
  };
  summary: {
    headline:string;
    short_paragraph:string;
    top_three_quick_wins: {
        title: string;
        impact_score: number;
        eta_minutes: number;
        steps: string[];
    }[];
  };
  technical_audit?: any;
  html_report?: string;
}

export interface WebsiteReportJobOutput {
    type: 'json' | 'html';
    payload: WebsiteReportResult | string;
}


// --- AI Sales Email Rewrite (Blueprint-Compliant) ---
export interface EmailRewriteInitialRequest {
  user_email: string;
  user_name: string;
  original_email: string; // Subject
  user_message: string; // Body
  message_type: string;
  tone: string;
  variations: number;
  timestamp: string;
}

// This is the shape of a draft (initial or revised)
export interface EmailRewriteDraftData {
  subject: string;
  body: string;
  "message_for_user"?: string;
  "confidence_score"?: string;
  resumeUrl: string;
}

// This is the shape of the final output after approval
export interface EmailRewriteFinalOutput {
  output: string;
}

// The response from the initial webhook is always a draft
export type EmailRewriteInitialResponse = EmailRewriteDraftData[];

// The response from the resumeUrl GET can be a new draft or the final output
export type EmailRewriteResumeResponse = (EmailRewriteDraftData | EmailRewriteFinalOutput)[];


// --- AI Strategy Call ---
export interface StrategyCallForm {
  email: string;
  company: string;
  budget: "<10k" | "10k-50k" | ">50k";
  decision_maker: "yes" | "no";
  timeframe: "now" | "30d" | "90d";
  notes?: string;
}

export interface AIStrategyFormData {
  // Step 1
  name: string;
  email: string;
  phone: string;
  companyName: string;
  websiteUrl: string;
  industry: string;
  companySize: 'Solo' | '2-10' | '11-50' | '50-200' | '200+';
  monthlyRevenue: '<$10K' | '$10-50K' | '$50-100K' | '$100-500K' | '$500K+';
  
  // Step 2
  painPoints: string[];
  otherPainPoint: string;
  biggestChallenge: string;
  currentTools: string;
  monthlyToolSpend: '<$500' | '$500-2K' | '$2K-5K' | '$5K+';

  // Step 3
  primaryGoal: 'Increase Revenue' | 'Reduce Costs' | 'Scale Team' | 'Improve Efficiency' | 'Better Customer Experience';
  specificTarget: string;
  dreamScenario: string;
  currentAIUsage: 'None' | 'Basic (ChatGPT)' | 'Some tools' | 'Advanced';
  aiKnowledge: number;
  improvementBudget: '<$1K' | '$1-5K' | '$5-10K' | '$10K+';
  implementationTimeline: 'ASAP' | '1-3 months' | '3-6 months' | '6+ months';

  // Step 4
  userRole: 'Owner/CEO' | 'Manager' | 'Operations' | 'Marketing' | 'IT';
  teamBreakdown: {
    sales: number;
    marketing: number;
    support: number;
    operations: number;
    technical: number;
    other: number;
  };
  biggestTeamChallenge: 'Hiring' | 'Training' | 'Productivity' | 'Communication' | 'Retention';
  decisionMakers: string[];
  otherDecisionMaker: string;
  decisionSpeed: 'Same day' | 'Within a week' | '2-4 weeks' | '1+ months';
  finalThoughts: string;
}

export interface StrategyCallStartResponse {
  status: "accepted";
  booking_url: string;
  pre_brief_url?: string;
}

// --- 5-Day AI Business Simulator ---
export interface SimulatorSignup {
  email: string;
  company: string;
  website: string;
  goal: string;
}

export interface SimulatorStartResponse {
  status: "accepted";
  sim_id: string;
  day_plan: number[];
  estimated_end: string;
}

export interface SimulatorDayOutput {
  day: 1 | 2 | 3 | 4 | 5;
  title: string;
  summary: string;
  artifact_url?: string; 
  score?: number;
  fixes?: { id: string; title: string; impact: string }[];
  leads_sample?: any[];
  html_output?: string;
  html?: string; 
  pdf_url?: string; 
  cta?: { label: string; target: "upgrade" | "book-call" | "start-service"; };
  completed_at: string;
}

export interface SimulatorDayResponse {
  status: "completed" | "accepted";
  job_id: string;
  day: number;
  result?: SimulatorDayOutput;
  message?: string;
  updated_sheet?: boolean;
  created_at?: string;
}

export interface SimulatorJob {
    job_id: string;
    user_email: string;
    user_name: string;
    company: string;
    website: string;
    industry: string;
    team_size: string;
    monthly_revenue: string;
    primary_goal: string;
    competitor_url: string;
    status: string;
    created_at: string;
    updated_at: string;
    day1_completed: string;
    day1_summary: string;
    day1_score: string;
    day1_pdf: string;
    day2_completed: string;
    day2_summary: string;
    day2_score: string;
    day2_fixes_json: string;
    day2_pdf: string;
    day3_completed: string;
    day3_email_a_subject: string;
    day3_email_a_body: string;
    day3_email_b_subject: string;
    day3_email_b_body: string;
    day4_completed: string;
    day4_leads_count: string;
    day4_leads_sheet_url: string;
    day5_completed: string;
    day5_roi_summary: string;
    day5_roi_value: string;
    day5_pdf: string;
    notes: string;
    [key: string]: any;
}

export type DayStatus = 'locked' | 'ready' | 'running' | 'completed' | 'pending' | 'failed';


// --- Email Templates ---
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
  userEmail: string;
}

// --- AI Replier Agent Types ---
// FIX: Changed ReplierRow to use a flexible index signature `[key: string]: any;`.
// This resolves a conflict where properties like `rowNumber` (a number) were incompatible
// with the previous `Record<string, string>` constraint, which forced all properties to be strings.
// This new type correctly models a flexible object with some strongly-typed known properties.
export type ReplierRow = {
  // Base fields from sheet, which can have any value from sheet parsing
  [key: string]: any;

  // Strongly typed known/derived fields
  rowNumber: number;
  "Request ID": string;
  "Submission Timestamp": string;
  "Last Updated": string;
  "User Name": string;
  "User Email": string;
  // ... and all other string fields from the sheet header

  // Derived fields added by the frontend
  submitted: Date | null;
  minutesAgo: number | null;
  aiConfidence: number;
  confidenceCategory: 'high' | 'medium' | 'low';
};

export interface ReplierKpis {
  conversationsToday: number;
  bookedMeetings: number;
  aiSuccessRate: number;
  escalations: number;
}

// --- Microservices Dashboard Types ---
export interface DashboardUser {
  user_email: string;
  user_name: string;
  total_simulations: number;
  ai_readiness_runs: number;
  website_analyzer_runs: number;
  email_rewrite_runs: number;
  leadgen_runs: number;
  roi_runs: number;
  last_ai_readiness_score: number;
  last_website_score: number;
  last_leads_count: number;
  overall_roi_value: string; // e.g., "22%"
  last_updated: string;
}

export interface RoiJob {
  job_id: string;
  user_email: string;
  company: string;
  baseline_leads: number;
  avg_deal_value: number;
  conversion_rate: number;
  monthly_revenue: number;
  time_spent_manual: string; // e.g., "40 hrs/mo"
  ai_time_saved: string; // e.g., "30%"
  ai_conversion_lift: string; // e.g., "15%"
  revenue_upside: number;
  time_saving_value: number;
  total_roi_percent: string; // e.g., "70%"
  roi_pdf_url: string;
  created_at: string;
  completed_at: string;
  status: 'completed' | 'running' | 'failed';
}

// --- Core Services Dashboard Types ---
export interface DashboardAggregate {
  totalRuns: number;
  totalLeads: number;
  totalRevenue: number;
  ticketsResolved: number;
  roiPercent: number;
  roiValue: number;
}

export interface ServiceRunSummary {
  serviceKey: string;
  serviceName: string;
  runs: number;
  lastSummary: string;
  lastDate: string | null;
  lastReportUrl?: string;
  link: string;
  icon: React.ReactNode;
  color: string;
}

// --- Main Dashboard Blueprint Types ---
export interface MainDashboardData {
  user_email: string;
  user_name: string;
  total_runs: number;
  research_runs: number;
  web_runs: number;
  support_runs: number;
  sales_runs: number;
  leadgen_runs: number;
  custom_runs: number;
  last_research_summary: string;
  last_sales_summary: string;
  last_leads_count: number;
  last_support_csat: string;
  last_roi_percent: string;
  overall_roi_percent: string;
  revenue_unlocked: string;
  time_saved_hours: number;
  achievements_unlocked: string;
  growth_score: number;
  last_updated: string;
  
  // Fields needed for computations, fetched from other sources
  last_website_score?: number;
  last_ai_readiness_score?: number;

  // Fields computed on the frontend
  computed_revenue_unlocked: number;
  computed_time_saved_hours: number;
  computed_growth_score: number;
}

export interface RecentEvent {
    type: 'simulator' | 'roi' | 'report';
    date: Date;
    title: string;
    summary: string;
    link: string;
    icon: React.ReactNode;
}