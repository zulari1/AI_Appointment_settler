// services/utils.ts

/**
 * Cleans and validates a raw transcript string to ensure it's meaningful before processing.
 * - Trims whitespace.
 * - Removes leading/trailing punctuation.
 * - Collapses multiple punctuation marks.
 * - Rejects transcripts that are too short or contain only noise.
 * @param raw The raw string from the speech-to-text service.
 * @returns A cleaned, meaningful string, or an empty string if invalid.
 */
export function sanitizeTranscript(raw: string): string {
  if (!raw) return '';
  
  // Trim and collapse whitespace
  let s = raw.replace(/\s+/g,' ').trim();
  
  // Strip leading/trailing punctuation (supports Unicode characters)
  s = s.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
  
  // Collapse long punctuation runs into a single space
  s = s.replace(/[\p{P}\p{S}]{2,}/gu, ' ');
  
  // Drop a transcript that is only a single punctuation mark or period.
  if (/^[\p{P}\p{S}]$/u.test(s.trim())) return '';

  // Reject if, after cleaning, the transcript is too short
  if (s.trim().length < 2) return '';

  return s.trim();
}
