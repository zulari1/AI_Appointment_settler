export interface Lead {
  email: string;
  name: string;
  cid?: string;
  firstVisitTimestamp?: number;
}

export interface Message {
  id: string;
  role: 'system' | 'assistant' | 'user';
  content: string;
  audioBase64?: string | null;
  imageUrl?: string | null;
  timestamp: number;
}

export interface WebhookPayload {
  sessionId: string; // Unique ID for the session/conversation
  lead: Lead;
  message?: string; // The specific message content being sent (latest only)
  meta: {
    source: string;
    userAgent: string;
    pageUrl: string;
  };
  urlParams?: Record<string, string>; // All URL parameters from the visit
  session_start?: boolean;
  action?: string; // e.g., 'confirm_appointment'
}

export interface WebhookResponseItem {
  transcript: string;
  audioBase64?: string | null;
  imageUrl?: string | null;
  requires_confirmation?: boolean; // Optional flag if AI logic supports it
  extracted_data?: {
    datetime?: string;
    channel?: string;
  };
}

export type WebhookResponse = WebhookResponseItem[];

export interface AppointmentDetails {
  datetime?: string;
  channel?: string;
  notes?: string;
  isReadyToConfirm: boolean;
}