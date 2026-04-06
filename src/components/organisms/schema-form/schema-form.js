/**
 * Schema-driven form organism — auto-generates fields from JSON Schema + layout.
 * Fetches schema via OPTIONS, renders grouped form-fields, submits JSON.
 * @module components/organisms/schema-form
 */

import { html, define, dispatch } from 'hybrids';
import { fetchSchema } from '#utils/fetchSchema.js';
import { renderFormFields } from '#utils/renderFormFields.js';
import { submitEntity } from '#utils/submitEntity.js';
import '#molecules/form-field/form-field.js';

/**
 * @typedef {Object} SchemaFormHost
 * @property {string} endpoint
 * @property {string} entityId
 * @property {string} defaults - JSON string of pre-filled hidden values
 * @property {object|undefined} schema
 * @property {object|undefined} layout - Form layout definition
 * @property {*} _fetch - Internal fetch trigger
 * @property {Record<string, string>} values
 * @property {string} error
 * @property {Record<string, string>} fieldErrors
 */

export default define({
  tag: 'schema-form',
  endpoint: '',
  entityId: '',
  defaults: '',
  error: '',
  fieldErrors: { value: /** @type {Record<string, string>} */ ({}) },
  schema: undefined,
  layout: undefined,
  _fetch: {
    value: undefined,
    /** @param {SchemaFormHost & HTMLElement} host */
    connect(host, _key, invalidate) {
      if (!host.endpoint) return;
      fetchSchema(host.endpoint)
        .then((res) => {
          host.schema = res.schema;
          host.layout = res.layout;
          invalidate();
        })
        .catch((e) => {
          host.error = e.message;
        });
    },
  },
  values: {
    value: {},
    /** @param {SchemaFormHost & HTMLElement} host */
    connect(host) {
      if (!host.entityId || !host.endpoint) return;
      fetch(`${host.endpoint}/${host.entityId}`)
        .then((r) => r.json())
        .then((data) => {
          host.values = data;
        });
    },
  },
  render: {
    value: (host) => {
      const { schema, layout, values, error, fieldErrors } = host;
      if (error) return html`<div class="error-message">${error}</div>`;
      if (!schema) return html`<div class="loading"><span class="spinner"></span> Loading...</div>`;
      const actionsAlign = layout?.actions?.align || 'left';

      return html`
        <form class="schema-form" onsubmit="${handleSubmit}" onfield-change="${handleFieldChange}">
          <div class="schema-form-fields">
            ${renderFormFields(schema, layout, values, fieldErrors)}
          </div>
          <div class="schema-form-actions schema-form-actions-${actionsAlign}">
            <button type="submit" class="btn btn-success">
              ${host.entityId ? 'Save' : 'Create'}
            </button>
            <button type="button" class="btn btn-secondary" onclick="${handleCancel}">
              Cancel
            </button>
          </div>
        </form>
      `;
    },
    shadow: false,
  },
});

/** @param {SchemaFormHost & HTMLElement} host */
function handleFieldChange(host, event) {
  const { name, value } = /** @type {CustomEvent} */ (event).detail;
  host.values = { ...host.values, [name]: value };
}

/** @param {SchemaFormHost & HTMLElement} host */
function handleSubmit(host, event) {
  event.preventDefault();
  host.fieldErrors = {};
  host.error = '';
  const defaults = host.defaults ? JSON.parse(host.defaults) : {};
  submitEntity(host.endpoint, host.entityId, { ...defaults, ...host.values }).then((result) => {
    if (result.ok) return dispatch(host, 'submit', { detail: result.data, bubbles: true });
    if (result.fields) host.fieldErrors = result.fields;
    else host.error = result.error || 'Unknown error';
  });
}

/** @param {SchemaFormHost & HTMLElement} host */
function handleCancel(host) {
  dispatch(host, 'cancel', { bubbles: true });
}
