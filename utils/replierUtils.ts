// utils/replierUtils.ts
import { ReplierRow, ReplierKpis } from '../types';

/**
 * Normalizes the raw array response from Google Sheets API into an array of objects.
 */
export function normalizeSheetResponse(values: string[][]): ReplierRow[] {
  if (!values || values.length < 2) return [];
  const headers = values[0];
  const dataRows = values.slice(1);
  
  const rows = dataRows.map((row, index) => {
    const obj: any = { rowNumber: index + 2 }; // Sheets are 1-indexed, and row 1 is headers.
    headers.forEach((h, i) => {
      obj[h.trim()] = row[i] || "";
    });
    return obj;
  });
  // Cast to any and then to ReplierRow[] to satisfy TypeScript
  return rows as any as ReplierRow[];
}

/**
 * Parses a timestamp string from the sheet into a Date object.
 * Supports ISO format and "YYYY-MM-DD HH:mm:ss" format.
 */
export function parseTS(s: string | null | undefined): Date | null {
    if (!s) return null;
    // Standard ISO format works directly
    let date = new Date(s);
    if (!isNaN(date.getTime())) return date;
    // Try replacing space with 'T' for YYYY-MM-DD HH:mm:ss
    date = new Date(s.replace(' ', 'T'));
    if (!isNaN(date.getTime())) return date;
    return null;
}

/**
 * Derives computed fields for a single row object.
 */
export function deriveRow(row: any): ReplierRow {
    const submitted = parseTS(row['Submission Timestamp']);
    const last = parseTS(row['Last Updated']) || submitted;
    
    const minutesAgo = submitted ? Math.round((Date.now() - submitted.getTime()) / 60000) : null;

    let aiConfidence = 0;
    const confidenceScoreField = row['AI Confidence Score'];
    if (confidenceScoreField && !isNaN(Number(confidenceScoreField))) {
        aiConfidence = Number(confidenceScoreField);
    } else if (row['AI Action/Response']) {
        const match = String(row['AI Action/Response']).match(/(\d{1,3})%/);
        if (match) {
            aiConfidence = Number(match[1]);
        }
    }
    
    const confidenceCategory = aiConfidence >= 90 ? 'high' : aiConfidence >= 70 ? 'medium' : 'low';

    return {
        ...row,
        rowNumber: Number(row.rowNumber),
        submitted,
        minutesAgo,
        aiConfidence,
        confidenceCategory,
    };
}

/**
 * Calculates high-level KPIs from a list of rows based on the new blueprint.
 */
export function calcKPIs(rows: ReplierRow[]): ReplierKpis {
    const today = new Date();
    const isToday = (d: Date | null) => d && d.toDateString() === today.toDateString();

    const todaysRows = rows.filter(r => isToday(r.submitted));

    const conversationsToday = todaysRows.length;
    
    const bookedMeetings = rows.filter(r => 
        String(r['AI Classification'] || '').toLowerCase() === 'sales lead' &&
        String(r['Final Outcome'] || '').toLowerCase().includes('scheduled')
    ).length;
    
    const escalations = rows.filter(r => String(r['Human Escalation Needed']).toUpperCase() === 'YES').length;
    
    const aiCompletedRows = rows.filter(r => 
        String(r.Status).toLowerCase() === 'completed' &&
        Boolean(String(r['AI Action/Response'] || '').trim())
    ).length;

    const totalRows = rows.length > 0 ? rows.length : 1;
    
    const aiSuccessRate = Math.round((aiCompletedRows / totalRows) * 100);

    return { conversationsToday, bookedMeetings, aiSuccessRate, escalations };
}

/**
 * Groups rows into status buckets as per the new blueprint.
 */
export function groupRowsByStatus(rows: ReplierRow[]): { title: string, items: ReplierRow[] }[] {
    const groups: { [key: string]: ReplierRow[] } = {
        'Action Required': [],
        'Ready to Send': [],
        'Recently Handled': [],
        'Archived': [],
    };

    rows.forEach(row => {
        const status = String(row.Status || '').toLowerCase();
        const escalation = String(row['Human Escalation Needed'] || '').toUpperCase();
        const minutesAgo = row.minutesAgo || 0;

        if (escalation === 'YES' || status === 'awaiting human') {
            groups['Action Required'].push(row);
        } else if (status === 'completed' || status === 'escalated') {
            if (minutesAgo > 24 * 60) {
                 groups['Archived'].push(row);
            } else {
                 groups['Recently Handled'].push(row);
            }
        } else if (status === 'pending' || status === 'in progress') {
            groups['Ready to Send'].push(row);
        } else {
             groups['Recently Handled'].push(row); // Fallback
        }
    });

    return Object.entries(groups)
        .map(([title, items]) => ({ title, items: items.sort((a,b) => (b.submitted?.getTime() || 0) - (a.submitted?.getTime() || 0)) }))
        .filter(g => g.items.length > 0);
}