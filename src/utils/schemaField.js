/**
 * Maps a JSON Schema property definition to form-field attributes.
 * Only includes constraint attributes when the schema defines them.
 * @module utils/schemaField
 */

/**
 * @typedef {Object} FieldAttrs
 * @property {string} type
 * @property {string} format
 * @property {string} options - Comma-joined enum values or ''
 * @property {string} optionTitles - Comma-joined display labels for enum values
 * @property {string} title - Human-readable label from schema
 * @property {string} description - Help text from schema
 * @property {string} placeholder - Placeholder from schema
 * @property {number} [minLength]
 * @property {number} [maxLength]
 * @property {number} [min]
 * @property {number} [max]
 * @property {string} [pattern]
 */

/**
 * Extract form-field attributes from a JSON Schema property.
 * @param {object} prop - JSON Schema property definition
 * @returns {FieldAttrs}
 */
export function schemaFieldAttrs(prop) {
  const attrs = {
    type: prop.type || 'string',
    format: prop.format || '',
    options: (prop.enum || []).join(','),
    optionTitles: (prop.enumTitles || []).join(','),
    title: prop.title || '',
    description: prop.description || '',
    placeholder: prop.placeholder || prop.examples?.[0] || '',
  };
  if (prop.minLength) attrs.minLength = prop.minLength;
  if (prop.maxLength) attrs.maxLength = prop.maxLength;
  if (prop.minimum !== undefined) attrs.min = prop.minimum;
  if (prop.maximum !== undefined) attrs.max = prop.maximum;
  if (prop.pattern) attrs.pattern = prop.pattern;
  return attrs;
}
