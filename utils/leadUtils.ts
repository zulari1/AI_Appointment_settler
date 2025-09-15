import { Lead } from '../types';

// User-provided helpers from PRD
export function parseIntSafe(v: any){ const n = Number(v); return Number.isFinite(n)? n: 0; }

export function freshnessDays(dateStr: string): number {
  if(!dateStr) return 9999;
  try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 9999;
      const diff = Date.now() - d.getTime();
      return Math.round(diff / (1000*60*60*24));
  } catch(e) {
      return 9999;
  }
}

export function outreachStatusFromRow(row: any): string {
  if(String(row['Opted Out'] || row['OptedOut'] || '').toUpperCase() === 'YES') return 'Opted-Out';
  if(String(row['Replied'] || '').toUpperCase() === 'YES') return 'Replied';
  const sent1 = String(row['Email#1 Sent']||'').toUpperCase() === 'YES';
  const sent2 = String(row['Email#2 Sent']||'').toUpperCase() === 'YES';
  const sent3 = String(row['Email#3 Sent']||'').toUpperCase() === 'YES';
  if (sent3) return 'Sent (stage 3)';
  if (sent2) return 'Sent (stage 2)';
  if (sent1) return 'Sent (stage 1)';
  const anyBody = (row['Email#1 Body']||'').trim() || (row['Email #2 Body']||'').trim() || (row['Email#3 Body']||'').trim();
  if (anyBody) return 'Drafted';
  return 'Not started';
}

export function emailsCraftedCount(row: any): number {
  let c = 0;
  if ((row['Email#1 Body']||'').trim()) c++;
  if ((row['Email #2 Body']||'').trim()) c++;
  if ((row['Email#3 Body']||'').trim()) c++;
  return c;
}

export function emailsSentCount(row: any): number {
  let c = 0;
  if (String(row['Email#1 Sent']||'').toUpperCase() === 'YES') c++;
  if (String(row['Email#2 Sent']||'').toUpperCase() === 'YES') c++;
  if (String(row['Email#3 Sent']||'').toUpperCase() === 'YES') c++;
  return c;
}

function normalizePercent(n: number){ return Math.max(0, Math.min(100, Math.round(n))); }

export function priorityScoreFromRow(row: any): number {
  const title = String(row['Job Title']||'').toLowerCase();
  const roleMatch = title.match(/ceo|founder|owner|manager|director|procurement|purchas/i) ? 90 : (title? 50 : 20);
  const contactQuality = ((row['Email Address'] && row['Email Address'].includes('@') )? 40:0)
                       + (row['LinkedIn URL'] ? 30:0)
                       + (row['Phone Number'] ? 30:0);
  const companyRelevance = (row['Industry'] && row['Industry'].length>0) ? 60 : 30;
  const seniorityMap: any = { entry:20, junior:40, mid:60, manager:80, director:90, vp:95, c:100 };
  const seniorityScore = seniorityMap[(String(row['Seniority']||'').toLowerCase())] || 50;
  const researchDepth = Math.min(100, ((String(row['Research Report']||'').length) / 1000) * 100);

  const score = 0.30*roleMatch + 0.25*(contactQuality) + 0.20*companyRelevance + 0.10*seniorityScore + 0.10*researchDepth + 0.05*(String(row['Replied']||'').toUpperCase()==='YES'?100:0);
  return normalizePercent(score);
}

export function progressStepFromRow(row: any): string {
  if (String(row['Replied']||'').toUpperCase() === 'YES') return 'Response';
  if (emailsSentCount(row) > 0) return 'Send';
  if (emailsCraftedCount(row) > 0) return 'Personalize';
  if (String(row['Analysed']||'').toUpperCase() === 'YES') return 'Research';
  return 'Hunt';
}

// Main transformer function
export const computeLeadFields = (lead: any): Lead => {
    const computedLead: any = { ...lead };

    computedLead.id = String(lead.rowNumber || lead['Email Address']);
    computedLead.FullName = lead['FullName'] || [lead['First Name'], lead['Last Name']].filter(Boolean).join(' ');
    computedLead['Email Address'] = lead['Email Address'] || '';
    computedLead['Company Name'] = lead['Company Name'] || '';
    computedLead['Job Title'] = lead['Job Title'] || '';
    computedLead.Location = lead['Location'] || '';
    computedLead.Country = lead['Country'] || '';
    computedLead.Industry = lead['Industry'] || '';
    computedLead['Website URL'] = lead['Website URL'] || '';
    computedLead['LinkedIn URL'] = lead['LinkedIn URL'] || '';
    computedLead['Research Report'] = lead['Research Report'] || '';
    computedLead.Analysed = lead['Analysed'] || 'NO';
    computedLead.Replied = lead['Replied'] || 'NO';

    // Aliases for easier dot notation access
    computedLead.displayName = computedLead.FullName;
    computedLead.email = computedLead['Email Address'];
    computedLead.company = computedLead['Company Name'];
    computedLead.title = computedLead['Job Title'];
    computedLead.location = computedLead.Location;
    computedLead.country = computedLead.Country;
    computedLead.industry = computedLead.Industry;
    computedLead.websiteUrl = computedLead['Website URL'];
    computedLead.linkedinUrl = computedLead['LinkedIn URL'];
    computedLead.researchReportHtml = computedLead['Research Report'];

    // Booleans
    computedLead.analyzedBool = String(computedLead.Analysed).toUpperCase() === 'YES';
    computedLead.repliedBool = String(computedLead.Replied).toUpperCase() === 'YES';
    computedLead.hasReport = !!computedLead.researchReportHtml.trim();
    
    // Computed statuses and scores from PRD spec
    computedLead.outreachStatus = outreachStatusFromRow(lead);
    computedLead.emailsCraftedCount = emailsCraftedCount(lead);
    computedLead.emailsSentCount = emailsSentCount(lead);
    computedLead.sentCount = computedLead.emailsSentCount; // alias
    computedLead.priorityScore = priorityScoreFromRow(lead);
    computedLead.qualityScore = computedLead.priorityScore; // alias
    computedLead.progressStep = progressStepFromRow(lead);
    computedLead.freshnessDays = freshnessDays(lead.Date);
    
    return computedLead as Lead;
};
