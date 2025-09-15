// utils/supportUtils.ts
import { SupportRow } from '../types';

export interface SupportKpis {
    conversationsToday: number;
    resolved: number;
    escalated: number;
    resolutionRate: number;
}

export function parseTimestamp(ts: string | null | undefined): Date | null {
    if (!ts) return null;
    let date = new Date(ts);
    if (!isNaN(date.getTime())) return date;
    date = new Date(ts.replace(' ', 'T'));
    if (!isNaN(date.getTime())) return date;
    return null;
}

export function timeAgo(ts: string) {
    const d = parseTimestamp(ts);
    if (!d) return '';
    const mins = Math.round((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.round(hrs / 24);
    return `${days}d`;
}

export function parseProcessing(s: string = ''): number {
    if (!s) return 0;
    const minMatch = s.match(/(\d+)m/);
    const secMatch = s.match(/(\d+)s/);
    const minutes = minMatch ? parseInt(minMatch[1], 10) : 0;
    const seconds = secMatch ? parseInt(secMatch[1], 10) : 0;
    return minutes * 60 + seconds;
}

export function calcKPIs(rows: SupportRow[]): SupportKpis {
    if (!rows || rows.length === 0) {
        return { conversationsToday: 0, resolved: 0, escalated: 0, resolutionRate: 0 };
    }
    
    const today = new Date().toDateString();
    const conversationsToday = rows.filter(r => parseTimestamp(r.Timestamp)?.toDateString() === today).length;
    const resolved = rows.filter(r => r.Status === 'Complete').length;
    const escalated = rows.filter(r => String(r['Escalation Flag']).toUpperCase() === 'TRUE' || String(r['Escalation Flag']).toUpperCase() === 'YES').length;
    
    const resolutionRate = Math.round((resolved / Math.max(1, rows.length)) * 100);

    return {
        conversationsToday,
        resolved,
        escalated,
        resolutionRate,
    };
}
