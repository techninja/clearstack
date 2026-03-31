/**
 * Fetch entity schema and allowed methods via OPTIONS.
 * @module utils/fetchSchema
 */

/**
 * @typedef {Object} SchemaResponse
 * @property {object} schema - JSON Schema for the entity
 * @property {object} [layout] - Form layout definition
 * @property {string[]} methods - Allowed HTTP methods
 */

/**
 * Fetch schema and capabilities for an entity endpoint.
 * @param {string} url - API endpoint, e.g. '/api/projects'
 * @returns {Promise<SchemaResponse>}
 */
export async function fetchSchema(url) {
  const res = await fetch(url, { method: 'OPTIONS' });
  if (!res.ok) throw new Error(`OPTIONS ${url}: ${res.status}`);
  return res.json();
}
