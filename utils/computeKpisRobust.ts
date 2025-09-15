// computeKpisRobust.ts
import { isSameDay } from 'date-fns';

/**
 * Robust date parser that handles:
 * - ISO with timezone: 2025-09-04T15:32:52.163+05:00
 * - Space-separated datetime: 2025-09-01 09:15:22
 * - Date-only: 2025-09-03
 * - Already-a-Date object
 *
 * Returns a JS Date object or null if not parseable.
 */
export function parseSheetDate(value: any, preferTimeZone = 'Asia/Karachi'): Date | null {
  if (!value && value !== 0) return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;

  const s = String(value).trim();
  // ISO-like with T or timezone offset should parse via Date
  if (/\d{4}-\d{2}-\d{2}T/.test(s) || /\+\d{2}:\d{2}$/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  // space separated datetime -> convert first space to 'T'
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
    const iso = s.replace(' ', 'T');
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return d;
  }

  // date-only 'YYYY-MM-DD' -> construct local date (year, month-1, day)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    const dt = new Date(y, m - 1, d); // local midnight
    return isNaN(dt.getTime()) ? null : dt;
  }

  // Try fallback parse
  const fallback = new Date(s);
  if (!isNaN(fallback.getTime())) return fallback;

  return null;
}

/**
 * Compute KPIs robustly.
 * timezone: IETF tz (e.g., 'Asia/Karachi') — used for computing 'today' baseline.
 */
export function computeKpisRobust(rows: any[], timezone = 'Asia/Karachi') {
  // Generate 'today' date object in desired timezone by creating a string of the current date in that timezone.
  // Using toLocaleString with en-CA returns YYYY-MM-DD (reliable)
  const now = new Date();
  const todayString = now.toLocaleDateString('en-CA', { timeZone: timezone }); // '2025-09-01'
  const todayParts = todayString.split('-').map(Number);
  const todayDateLocal = new Date(todayParts[0], todayParts[1] - 1, todayParts[2]);

  let conversationsToday = 0;
  let meetingsBookedToday = 0;
  let escalations = 0;
  // debug row diagnostics
  const diagnostics: any[] = [];

  for (const r of rows) {
    const rawTs = r['Timestamp'] ?? r['timestamp'] ?? '';
    const parsedTs = parseSheetDate(rawTs, timezone);
    // Check conversation today: parsedTs must be present and same day as todayDateLocal
    const isConversationToday = parsedTs
      ? isSameDay(parsedTs, todayDateLocal)
      : false;

    // Meeting booked today
    const meetingBooked = (String(r['Meeting Booked'] ?? r['MeetingBooked'] ?? '').trim().toLowerCase() === 'yes');
    const meetingDateRaw = r['Meeting Date'] ?? r['MeetingDate'] ?? '';
    const parsedMeetingDate = parseSheetDate(meetingDateRaw, timezone);
    const isMeetingToday = meetingBooked && parsedMeetingDate && isSameDay(parsedMeetingDate, todayDateLocal);

    // Escalation
    const isEscalated = String(r['Escalation'] ?? '').trim().toLowerCase() === 'yes';

    if (isConversationToday) conversationsToday++;
    if (isMeetingToday) meetingsBookedToday++;
    if (isEscalated) escalations++;

    diagnostics.push({
      rawTimestamp: rawTs,
      parsedTimestamp: parsedTs ? parsedTs.toISOString() : null,
      isConversationToday,
      meetingBooked,
      rawMeetingDate: meetingDateRaw,
      parsedMeetingDate: parsedMeetingDate ? parsedMeetingDate.toISOString() : null,
      isMeetingToday,
      escalated: isEscalated
    });
  }

  const bookingRate = conversationsToday > 0 ? Math.round((meetingsBookedToday / conversationsToday) * 100) : 0;

  return {
    conversationsToday,
    meetingsBooked: meetingsBookedToday,
    bookingRate,
    escalations,
    diagnostics
  };
}
