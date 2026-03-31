/**
 * Submit entity data to the API, handling 422 field errors.
 * @module utils/submitEntity
 */

/**
 * @typedef {Object} SubmitResult
 * @property {boolean} ok
 * @property {object} [data] - Response data on success
 * @property {string} [error] - General error message
 * @property {Record<string, string>} [fields] - Per-field errors on 422
 */

/**
 * Submit entity data via POST (create) or PUT (update).
 * @param {string} endpoint - API base, e.g. '/api/projects'
 * @param {string} entityId - Entity ID for update, empty for create
 * @param {object} values - Form values to submit
 * @returns {Promise<SubmitResult>}
 */
export async function submitEntity(endpoint, entityId, values) {
  const url = entityId ? `${endpoint}/${entityId}` : endpoint;
  const method = entityId ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 422 && data.fields) return { ok: false, fields: data.fields };
    return { ok: false, error: data.error || `Server error: ${res.status}` };
  }
  return { ok: true, data };
}
