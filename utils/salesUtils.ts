// utils/salesUtils.ts
import { SalesRow } from '../types';
import { parseSheetDate } from './computeKpisRobust';

/**
 * Maps the raw array-of-arrays response from Google Sheets API into an array of objects
 * using the first row as headers.
 */
export function mapValuesToObjects(values: string[][]): SalesRow[] {
  if (!values || values.length < 2) return [];
  const header = values[0];
  return values.slice(1).map((row, idx) => {
    const obj: { [key: string]: any } = {};
    header.forEach((k, i) => { obj[k] = row[i] ?? ''; });
    obj.rowNumber = idx + 2; // Sheet row index
    return obj as SalesRow;
  });
}

export function deriveRow(row: SalesRow): SalesRow {
  const submitted = parseSheetDate(row.Timestamp);
  const processedAt = parseSheetDate(row['Processed At']);
  const meetingDate = parseSheetDate(row["Meeting Date"]);
  const timeAgoMinutes = submitted ? Math.round((Date.now() - submitted.getTime()) / 60000) : null;
  const meetingBooked = String(row['Meeting Booked'] || '').toLowerCase() === 'yes';
  const isEscalated = String(row.Escalation || '').toLowerCase() === 'yes';
  const isApproved = String(row.Approval || '').toLowerCase() === 'yes' || String(row.Approval).toUpperCase() === 'YES';
  const dateOnly = submitted ? submitted.toISOString().split('T')[0] : '';

  return {
    ...row,
    submitted,
    processedAt,
    meetingDate,
    timeAgoMinutes,
    meetingBooked,
    isEscalated,
    isApproved,
    dateOnly,
  };
}
