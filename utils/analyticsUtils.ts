// utils/analyticsUtils.ts
import { WebAIAnalyticsData, WebAILogEntry } from '../types';

// This function now expects pre-filtered logs for the desired period.
export function computeWebAIAnalytics(logs: WebAILogEntry[]): WebAIAnalyticsData {
  const conversations = logs.length;

  const meetings = logs.filter((l) => l["Intent/Category"] === "Booking" && l["Meeting Date"]);
  // Count unique users who booked a meeting in the period
  const meetingsBooked = new Set(meetings.map((m) => m["Customer Email"])).size;

  const bookingRate = conversations > 0 ? Math.round((meetingsBooked / conversations) * 100) : 0;

  const escalations = logs.filter((l) => (l["Ticket Status"] || '').toLowerCase() === "open").length;

  const uniqueUsers = new Set(logs.map(r => (r['Customer Email']||'').toLowerCase()).filter(Boolean)).size;

  return {
      conversations,
      uniqueUsers,
      bookingsCreated: meetingsBooked,
      bookingRate,
      escalations,
      avgResponseMs: null, // User's logic doesn't include this, so we'll null it out.
  };
}
