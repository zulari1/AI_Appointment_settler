import DOMPurify from 'dompurify';
import { WebAITrainingRow, WebAITrainingDoc, UnifiedTrainingDoc } from '../types';

export interface TrainingExample {
  id: string;
  subject?: string;
  message: string;
  intent?: string;
  exampleResponse?: string;
}

// 1. Sanitization & PII
const PII_REGEX = {
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  url: /https?:\/\/[^\s]+/gi,
  phone: /\+?\d[\d\s-]{6,}\d/g
};

export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

export function redactPII(text: string): { redactedText: string; piiFound: string[] } {
  let piiFound: string[] = [];
  if (!text) return { redactedText: '', piiFound: [] };
  const redactedText = text
    .replace(PII_REGEX.email, (match) => { piiFound.push('email'); return '[REDACTED_EMAIL]'; })
    .replace(PII_REGEX.url, (match) => { piiFound.push('url'); return '[REDACTED_URL]'; })
    .replace(PII_REGEX.phone, (match) => { piiFound.push('phone'); return '[REDACTED_PHONE]'; });
  return { redactedText, piiFound: [...new Set(piiFound)] };
}

// 2. CSV Parsing
export function parseCSV(csvText: string): WebAITrainingRow[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const userMessageIndex = headers.findIndex(h => ['usermessage', 'user message', 'user says', 'question'].includes(h));
    const assistantReplyIndex = headers.findIndex(h => ['assistantreply', 'assistant reply', 'bot reply', 'answer'].includes(h));
    const intentIndex = headers.findIndex(h => h === 'intent');
    
    if (userMessageIndex === -1 || assistantReplyIndex === -1) {
        throw new Error("CSV must contain 'userMessage' and 'assistantReply' (or similar) columns.");
    }

    return lines.slice(1).map((line, idx) => {
        // Simple split, doesn't handle commas within quoted strings well
        const values = line.split(',');
        return {
            sampleId: `csv-${idx}`,
            userMessage: values[userMessageIndex]?.trim().replace(/"/g, '') || '',
            assistantReply: values[assistantReplyIndex]?.trim().replace(/"/g, '') || '',
            intent: intentIndex > -1 ? values[intentIndex]?.trim().replace(/"/g, '') : 'general',
        };
    }).filter(ex => ex.userMessage.trim().length > 0 && ex.assistantReply.trim().length > 0);
}

// 3. Quality Score (as per new blueprint)
export function computeQualityScore(rows: WebAITrainingRow[]): { score: number, issues: string[] } {
  if (rows.length === 0) return { score: 0, issues: ["No examples provided."] };

  const issues: string[] = [];

  // Rule 1: Valid examples
  const validExamples = rows.filter(r => {
      const userMsgValid = r.userMessage.trim().length > 3;
      const assistantReplyValid = r.assistantReply.trim().split(' ').length >= 3;
      return userMsgValid && assistantReplyValid;
  }).length;
  
  if (validExamples < rows.length) {
      issues.push(`${rows.length - validExamples} rows have incomplete content.`);
  }
  
  // Rule 2: Intent assignment
  const unassignedIntents = rows.filter(r => !r.intent || r.intent.trim() === 'general' || r.intent.trim() === '').length;
  if (unassignedIntents > 0) {
      issues.push(`${unassignedIntents} rows have a generic or missing intent.`);
  }

  // Final score calculation
  const score = Math.round((validExamples / rows.length) * 100) - (unassignedIntents * 5);

  return { score: Math.max(0, Math.min(100, score)), issues };
}

// 4. Agent IQ Calculation (as per new blueprint)
export function computeAgentIQ(docs: WebAITrainingDoc[], baseIQ = 10) {
  const weights: Record<WebAITrainingDoc['doc_type'], number> = {
    'Company DNA': 0.30, 
    'Product Data': 0.25, 
    'FAQ': 0.15, 
    'Meeting Info': 0.15, 
    'Personality': 0.15, 
    'Other': 0.08,
    // FIX: Added missing properties to satisfy the Record type.
    'Policy': 0.08,
    'SOP': 0.08,
    'Chat Scripts': 0.08,
    'Pricing Guide': 0.08,
    'Case Study': 0.08,
    'Objection Handling': 0.08,
    'Meeting Templates': 0.08
  };
  let completeness = 0;
  docs.forEach(d => {
    const w = weights[d.doc_type] || 0.08;
    const s = (d.doc_status === 'Complete') ? 1 : (d.doc_status === 'Partial' ? 0.5 : 0);
    completeness += w * s;
  });
  // completeness max ~1.0 (if all important docs complete)
  const iq = Math.round(Math.min(100, baseIQ + completeness * 80));
  return iq;
}

// 5. Sales Agent IQ Calculation (new blueprint)
export function computeSalesAgentIQ(docs: UnifiedTrainingDoc[]): number {
    const weights: { [key: string]: number } = {
        'Product Data': 10,
        'Pricing Guide': 15,
        'Case Study': 20,
        'Objection Handling': 25,
        'Meeting Templates': 30,
    };

    let totalPoints = 0;
    const maxPoints = Object.values(weights).reduce((sum, pts) => sum + pts, 0);


    docs.forEach(doc => {
        const points = weights[doc.doc_type] || 5; // Default 5 points for other doc types
        const statusMultiplier = doc.doc_status === 'Complete' ? 1 : doc.doc_status === 'Partial' ? 0.5 : 0;
        totalPoints += points * statusMultiplier;
    });

    if (maxPoints === 0) return 0;
    // Scale the points to a percentage
    return Math.round(Math.min(100, (totalPoints / maxPoints) * 100));
}