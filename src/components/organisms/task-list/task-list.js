/**
 * Task list organism — fetches tasks, inline edit, delete, drag reorder.
 * @module components/organisms/task-list
 */

import { html, define, store } from 'hybrids';
import TaskModel from '#store/TaskModel.js';
import { reorderTasks } from '#utils/reorderTasks.js';
import { onDragStart, onDragOver, onDragEnd, resolveDrop } from '#utils/dragReorder.js';
import '#molecules/task-card/task-card.js';
import '#organisms/schema-form/schema-form.js';

/**
 * @typedef {Object} TaskListHost
 * @property {string} projectId
 * @property {import('#store/TaskModel.js').Task[]} tasks
 * @property {string} selectedId
 */

/** @param {TaskListHost & HTMLElement} host */
function handleSelect(host, event) {
  const id = /** @type {CustomEvent} */ (event).detail.id;
  host.selectedId = host.selectedId === id ? '' : id;
}

/** @param {TaskListHost & HTMLElement} host */
function handleDelete(host, event) {
  const { id } = /** @type {CustomEvent} */ (event).detail;
  fetch(`/api/tasks/${id}`, { method: 'DELETE' }).then(() => store.clear([TaskModel]));
}

/** @param {TaskListHost & HTMLElement} host */
function handleDrop(host, event) {
  if (!(/** @type {any} */ (store).ready(host.tasks))) return;
  const ids = host.tasks.map((t) => t.id);
  const newIds = resolveDrop(event, ids);
  if (newIds) reorderTasks(newIds);
}

/** @param {TaskListHost & HTMLElement} host */
function onTaskSaved(host) {
  host.selectedId = '';
  store.clear([TaskModel]);
}

/** @param {TaskListHost & HTMLElement} host */
function onEditCancel(host) {
  host.selectedId = '';
}

/** @type {import('hybrids').Component<TaskListHost>} */
export default define({
  tag: 'task-list',
  projectId: '',
  selectedId: '',
  tasks: store([TaskModel], { id: (host) => ({ projectId: host.projectId, sort: 'sortOrder' }) }),
  render: {
    value: ({ tasks, selectedId }) => html`
      <div
        class="task-list"
        ondragstart="${onDragStart}"
        ondragover="${onDragOver}"
        ondragend="${onDragEnd}"
        ondrop="${handleDrop}"
      >
        ${
          /** @type {any} */ (store).pending(tasks) &&
          html` <div class="loading"><span class="spinner"></span> Loading tasks...</div>`
        }
        ${
          /** @type {any} */ (store).error(tasks) &&
          html` <div class="error-message">Failed to load tasks.</div>`
        }
        ${
          /** @type {any} */ (store).ready(tasks) &&
          tasks.length === 0 &&
          html` <p class="task-list-empty">No tasks yet.</p>`
        }
        ${
          /** @type {any} */ (store).ready(tasks) &&
          tasks.map((task) =>
            store.ready(task)
              ? html`
                  <div
                    class="task-list-item ${selectedId === task.id ? 'expanded' : ''}"
                    data-drag-id="${task.id}"
                  >
                    <task-card
                      task-id="${task.id}"
                      title="${task.title}"
                      status="${task.status}"
                      priority="${task.priority}"
                      onselect="${handleSelect}"
                      ondelete="${handleDelete}"
                    ></task-card>
                    ${selectedId === task.id &&
                    html` <div class="task-list-detail">
                      <schema-form
                        endpoint="/api/tasks"
                        entity-id="${task.id}"
                        onsubmit="${onTaskSaved}"
                        oncancel="${onEditCancel}"
                      ></schema-form>
                    </div>`}
                  </div>
                `.key(task.id)
              : html`<div class="task-list-item loading"><span class="spinner"></span></div>`.key(
                  task.id,
                ),
          )
        }
      </div>
    `,
    shadow: false,
  },
});
