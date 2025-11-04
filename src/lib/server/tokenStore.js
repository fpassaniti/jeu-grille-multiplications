// src/lib/server/tokenStore.js
export const activeGameTokens = new Set();

// Optional: Add a function to add a token with a timeout
// export function addTokenWithExpiry(token, durationMs = 5 * 60 * 1000) { // 5 minutes default
//   activeGameTokens.add(token);
//   setTimeout(() => {
//     activeGameTokens.delete(token);
//     console.log(`Token ${token} expired and removed.`);
//   }, durationMs);
// }
// For now, let's stick to just adding and deleting directly for simplicity.
// The score submission endpoint will delete the token upon use.
