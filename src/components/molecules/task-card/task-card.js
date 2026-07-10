/**
 * Task card molecule — displays a task with drag handle and delete.
 * Composes: app-badge, app-icon.
 * @module components/molecules/task-card
 */

import { html, define, dispatch } from 'hybrids';
import { t } from '#utils/i18n.js';
import { statusColor, priorityColor, statusTitle, priorityTitle } from '#utils/statusColors.js';
import '#atoms/app-badge/app-badge.js';
import '#atoms/app-icon/app-icon.js';

/**
 * @typedef {Object} TaskCardHost
 * @property {string} taskId
 * @property {string} title
 * @property {'todo'|'doing'|'done'} status
 * @property {'low'|'med'|'high'} priority
 * @property {boolean} confirming - Showing delete confirmation
 */

/** @param {TaskCardHost & HTMLElement} host */
function handleSelect(host) {
  dispatch(host, 'select', { detail: { id: host.taskId }, bubbles: true });
}

/** @param {TaskCardHost & HTMLElement} host */
function handleDeleteClick(host, e) {
  e.stopPropagation();
  host.confirming = true;
}

/** @param {TaskCardHost & HTMLElement} host */
function confirmDelete(host, e) {
  e.stopPropagation();
  host.confirming = false;
  dispatch(host, 'delete', { detail: { id: host.taskId }, bubbles: true });
}

/** @param {TaskCardHost & HTMLElement} host */
function cancelDelete(host, e) {
  e.stopPropagation();
  host.confirming = false;
}

export default define({
  tag: 'task-card',
  taskId: '',
  /** @type {string} */
  title: '',
  /** @type {'todo'|'doing'|'done'} */
  status: 'todo',
  /** @type {'low'|'med'|'high'} */
  priority: 'med',
  confirming: false,
  render: {
    value: ({ title, status, priority, confirming }) => html`
      <div class="task-card" onclick="${handleSelect}" draggable="true">
        <span class="task-card-grip" onmousedown="${(h, e) => e.stopPropagation()}">
          <app-icon name="grip" size="sm"></app-icon>
        </span>
        <app-badge label="${statusTitle(status)}" color="${statusColor(status)}"></app-badge>
        <app-badge
          label="${priorityTitle(priority)}"
          color="${priorityColor(priority)}"
        ></app-badge>
        <span class="task-card-title">${title}</span>
        ${confirming
          ? html`
              <span class="task-card-confirm">
                ${t('task.deleteConfirm')}
                <button class="btn btn-danger btn-xs" onclick="${confirmDelete}">
                  ${t('task.deleteConfirmYes')}
                </button>
                <button class="btn btn-secondary btn-xs" onclick="${cancelDelete}">
                  ${t('task.deleteConfirmNo')}
                </button>
              </span>
            `
          : html`
              <button class="task-card-delete" onclick="${handleDeleteClick}">
                <app-icon name="x" size="sm"></app-icon>
              </button>
            `}
      </div>
    `,
    shadow: false,
  },
});
