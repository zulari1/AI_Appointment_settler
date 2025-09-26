// utils/analyticsUtils.ts
// FIX: Replaced non-existent type 'WebAILogEntry' with 'WebAIConversationLog' from types.ts.
import { WebAIAnalyticsData, WebAIConversationLog } from '../types';

// This function now expects pre-filtered logs for the desired period.
export function computeWebAIAnalytics(logs: WebAIConversationLog[]): WebAIAnalyticsData {
  const conversations = logs.length;

  // FIX: Updated property access to match the snake_case properties of WebAIConversationLog.
  const meetings = logs.filter((l) => l.intent === "Booking" && l.meeting_date);
  // Count unique users who booked a meeting in the period
  const meetingsBooked = new Set(meetings.map((m) => m.customer_email)).size;

  const bookingRate = conversations > 0 ? Math.round((meetingsBooked / conversations) * 100) : 0;

  // FIX: Updated property access to match the snake_case properties of WebAIConversationLog.
  const escalations = logs.filter((l) => (l.ticket_status || '').toLowerCase() === "open").length;

  // FIX: Updated property access to match the snake_case properties of WebAIConversationLog.
  const uniqueUsers = new Set(logs.map(r => (r.customer_email||'').toLowerCase()).filter(Boolean)).size;

  return {
      conversations,
      uniqueUsers,
      bookingsCreated: meetingsBooked,
      bookingRate,
      escalations,
      avgResponseMs: null, // User's logic doesn't include this, so we'll null it out.
  };
}
