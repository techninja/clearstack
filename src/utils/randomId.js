/**
 * Generate a short random ID for client-side use.
 * @module utils/randomId
 * @returns {string} 8-character hex string
 */
export function randomId() {
  return Math.random().toString(16).slice(2, 10);
}
