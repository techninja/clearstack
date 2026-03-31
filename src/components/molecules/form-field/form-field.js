/**
 * Form field molecule — renders one input from a JSON Schema property.
 * Maps JSON Schema constraints to native HTML validation attributes.
 * @module components/molecules/form-field
 */

import { html, define, dispatch } from 'hybrids';

/**
 * @typedef {Object} FormFieldHost
 * @property {string} name - Property name
 * @property {string} label - Display label
 * @property {string} type - JSON Schema type: string, number, boolean
 * @property {string} format - JSON Schema format: email, date-time, etc.
 * @property {string} value - Current field value
 * @property {string} options - Comma-separated enum values (if any)
 * @property {string} optionTitles - Comma-separated display labels for options
 * @property {boolean} required - Whether field is required
 * @property {boolean} readOnly - Whether field is read-only
 * @property {number} minLength - Minimum string length
 * @property {number} maxLength - Maximum string length
 * @property {number} min - Minimum number value
 * @property {number} max - Maximum number value
 * @property {string} pattern - Regex pattern for validation
 * @property {string} error - Server-side validation error message
 * @property {string} description - Help text shown below the field
 * @property {string} placeholder - Placeholder text for the input
 */

/**
 * @param {FormFieldHost & HTMLElement} host
 * @param {Event} event
 */
function handleInput(host, event) {
  const el = /** @type {HTMLInputElement} */ (event.target);
  const val = host.type === 'boolean' ? String(el.checked) : el.value;
  dispatch(host, 'field-change', { detail: { name: host.name, value: val }, bubbles: true });
}

/** Resolve HTML input type from JSON Schema type + format. */
function inputType(type, format) {
  if (format === 'email') return 'email';
  if (format === 'uri') return 'url';
  if (format === 'date-time') return 'datetime-local';
  if (format === 'date') return 'date';
  if (type === 'number' || type === 'integer') return 'number';
  return 'text';
}

export default define({
  tag: 'form-field',
  name: '',
  label: '',
  type: 'string',
  format: '',
  value: '',
  options: '',
  optionTitles: '',
  required: false,
  readOnly: false,
  minLength: 0,
  maxLength: 0,
  min: 0,
  max: 0,
  pattern: '',
  error: '',
  description: '',
  placeholder: '',
  render: {
    value: (host) => {
      const { name, type, format, value, options, required, readOnly, error } = host;

      let field;
      if (options) {
        const opts = options.split(',');
        const titles = host.optionTitles ? host.optionTitles.split(',') : opts;
        field = html`<select
          name="${name}"
          required="${required}"
          onchange="${handleInput}"
          disabled="${readOnly}"
        >
          <option value="" disabled selected="${!value}">Select...</option>
          ${opts.map(
            (o, i) =>
              html`<option value="${o}" selected="${o === value}">${titles[i] || o}</option>`,
          )}
        </select>`;
      } else if (type === 'boolean') {
        field = html`<input
          type="checkbox"
          name="${name}"
          checked="${value === 'true'}"
          onchange="${handleInput}"
          disabled="${readOnly}"
        />`;
      } else {
        field = html`<input
          type="${inputType(type, format)}"
          name="${name}"
          value="${value}"
          placeholder="${host.placeholder}"
          required="${required}"
          readonly="${readOnly}"
          oninput="${handleInput}"
        />`;
      }

      return html` <div class="form-field ${required ? 'required' : ''} ${error ? 'error' : ''}">
        <label class="form-field-label">${host.label || name}</label>
        ${field}
        ${host.description && html`<span class="form-field-desc">${host.description}</span>`}
        ${error && html`<span class="error-message">${error}</span>`}
      </div>`;
    },
    observe(host) {
      const input = host.querySelector(`input[name="${host.name}"]`);
      if (!input) return;
      const set = (attr, val) =>
        val ? input.setAttribute(attr, String(val)) : input.removeAttribute(attr);
      set('minlength', host.minLength > 0 && host.minLength);
      set('maxlength', host.maxLength > 0 && host.maxLength);
      set('min', host.min > 0 && host.min);
      set('max', host.max > 0 && host.max);
      set('pattern', host.pattern);
    },
    shadow: false,
  },
});
