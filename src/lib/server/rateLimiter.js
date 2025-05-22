// src/lib/server/rateLimiter.js
const requestTimestamps = new Map(); // Stores IP -> array of timestamps

const MAX_REQUESTS = 10; // Max requests per window
const TIME_WINDOW_MS = 60 * 1000; // 1 minute window

const MAX_SCORE_REQUESTS = 5; // Max score submissions per window (more strict)
const SCORE_TIME_WINDOW_MS = 5 * 60 * 1000; // 5 minute window for scores

export function checkRateLimit(ip, isScoreSubmission = false) {
  const now = Date.now();
  let limit = isScoreSubmission ? MAX_SCORE_REQUESTS : MAX_REQUESTS;
  let windowMs = isScoreSubmission ? SCORE_TIME_WINDOW_MS : TIME_WINDOW_MS;

  if (!requestTimestamps.has(ip)) {
    requestTimestamps.set(ip, []);
  }

  const timestamps = requestTimestamps.get(ip);

  // Remove timestamps older than the time window
  const recentTimestamps = timestamps.filter(timestamp => now - timestamp < windowMs);
  requestTimestamps.set(ip, recentTimestamps);

  if (recentTimestamps.length >= limit) {
    return false; // Limit exceeded
  }

  recentTimestamps.push(now);
  return true; // Limit not exceeded
}

// Periodically clean up old IP entries to prevent memory leak
// (This is a simple cleanup; a more robust solution might use TTL entries in Redis)
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of requestTimestamps.entries()) {
    const recentTimestamps = timestamps.filter(timestamp => now - timestamp < Math.max(TIME_WINDOW_MS, SCORE_TIME_WINDOW_MS));
    if (recentTimestamps.length === 0) {
      requestTimestamps.delete(ip);
    } else {
      requestTimestamps.set(ip, recentTimestamps);
    }
  }
}, 10 * 60 * 1000); // Cleanup every 10 minutes
