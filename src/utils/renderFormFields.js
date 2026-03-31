/**
 * Renders form fields from JSON Schema + layout definition.
 * @module utils/renderFormFields
 */

import { html } from 'hybrids';
import { schemaFieldAttrs } from './schemaField.js';

/**
 * Render a single form-field element from a schema property.
 * @param {string} name - Field name
 * @param {object} prop - Schema property definition
 * @param {string[]} required - Required field names
 * @param {Record<string, string>} values - Current form values
 * @param {Record<string, string>} fieldErrors - Per-field errors
 */
function renderField(name, prop, required, values, fieldErrors) {
  const a = schemaFieldAttrs(prop);
  return html`
    <form-field
      name="${name}"
      label="${a.title || name}"
      type="${a.type}"
      format="${a.format}"
      value="${values[name] ?? prop.default ?? ''}"
      options="${a.options}"
      option-titles="${a.optionTitles}"
      required="${required.includes(name)}"
      min-length="${a.minLength || 0}"
      max-length="${a.maxLength || 0}"
      description="${a.description}"
      placeholder="${a.placeholder}"
      error="${fieldErrors[name] || ''}"
    ></form-field>
  `;
}

/**
 * Render all form fields, using layout groups if provided.
 * @param {object} schema - JSON Schema
 * @param {object|undefined} layout - Layout definition with groups
 * @param {Record<string, string>} values - Current values
 * @param {Record<string, string>} fieldErrors - Per-field errors
 */
export function renderFormFields(schema, layout, values, fieldErrors) {
  const props = schema.properties || {};
  const required = schema.required || [];
  const visible = Object.entries(props).filter(([_, p]) => !p.readOnly && !p.writeOnly);

  if (!layout?.groups) {
    return visible.map(([name, prop]) => renderField(name, prop, required, values, fieldErrors));
  }

  return layout.groups
    .map((group) => {
      const fields = group.fields.filter(
        (n) => props[n] && !props[n].readOnly && !props[n].writeOnly,
      );
      if (!fields.length) return null;
      const cols = group.columns || 1;
      return html`
        <div class="schema-form-group schema-form-cols-${cols}">
          ${fields.map((n) => renderField(n, props[n], required, values, fieldErrors))}
        </div>
      `;
    })
    .filter(Boolean);
}
