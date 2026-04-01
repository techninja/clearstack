/**
 * Server-side validation against JSON Schema.
 * Returns field-level errors for 422 responses.
 * @module api/validate
 */

import { schemas } from './db.js';

/**
 * Validate a request body against the entity's JSON Schema.
 * @param {string} entity - Entity name, e.g. 'projects'
 * @param {object} body - Request body to validate
 * @param {boolean} [partial=false] - If true, skip required checks for missing keys
 * @returns {{ valid: boolean, fields: Record<string, string> }}
 */
export function validate(entity, body, partial = false) {
  const entry = schemas.get(entity);
  if (!entry) return { valid: true, fields: /** @type {Record<string, string>} */ ({}) };

  /** @type {Record<string, string>} */
  const fields = {};
  const props = entry.schema.properties || {};
  const required = entry.schema.required || [];

  if (!partial) {
    for (const name of required) {
      const val = body[name];
      if (val === undefined || val === null || val === '') {
        fields[name] = `${name} is required`;
      }
    }
  }

  for (const [name, val] of Object.entries(body)) {
    const prop = props[name];
    if (!prop || prop.readOnly) continue;

    if (typeof val === 'string') {
      if (prop.minLength && val.length < prop.minLength) {
        fields[name] = `Minimum ${prop.minLength} characters`;
      }
      if (prop.maxLength && val.length > prop.maxLength) {
        fields[name] = `Maximum ${prop.maxLength} characters`;
      }
      if (prop.enum && !prop.enum.includes(val)) {
        fields[name] = `Must be one of: ${prop.enum.join(', ')}`;
      }
    }
  }

  return { valid: Object.keys(fields).length === 0, fields };
}
