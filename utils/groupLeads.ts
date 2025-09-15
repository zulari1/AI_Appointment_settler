import { Lead } from '../types';

export interface LeadGroup {
    date: string;
    items: Lead[];
}

export function groupLeadsByDate(leads: Lead[]): LeadGroup[] {
  const byDate: { [key: string]: Lead[] } = {};
  leads.forEach(l => {
    const d = l.Date ? new Date(l.Date).toISOString().slice(0,10) : 'Unknown Date';
    byDate[d] = byDate[d] || [];
    byDate[d].push(l);
  });
  
  const groups = Object.keys(byDate)
    .sort((a,b) => b.localeCompare(a)) // Sort by date descending
    .map(date => ({ date, items: byDate[date] }));
    
  return groups;
}
