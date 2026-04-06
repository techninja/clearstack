/**
 * Project detail page — header, whiteboard, and task list.
 * Route: /project/:projectId
 * @module pages/project
 */

import { html, define, store, router } from 'hybrids';
import TaskModel from '#store/TaskModel.js';
import { pageLayout } from '#templates/page-layout/page-layout.js';
import '#organisms/project-header/project-header.js';
import '#organisms/project-canvas/project-canvas.js';
import '#organisms/task-list/task-list.js';
import '#organisms/schema-form/schema-form.js';

/**
 * @typedef {Object} ProjectViewHost
 * @property {string} projectId - Set by router params
 * @property {boolean} addingTask
 */

/** @param {ProjectViewHost & HTMLElement} host */
function toggleAddTask(host) {
  host.addingTask = !host.addingTask;
}

/** @param {ProjectViewHost & HTMLElement} host */
function onTaskCreated(host) {
  host.addingTask = false;
  store.clear([TaskModel]);
}

/** @type {import('hybrids').Component<ProjectViewHost>} */
export default define({
  tag: 'project-view',
  [router.connect]: { url: '/project/:projectId' },
  projectId: '',
  addingTask: false,
  render: {
    value: ({ projectId, addingTask }) =>
      pageLayout(
        'Project',
        html`
          <div class="project-view">
            <div class="project-view-nav">
              <a href="${router.backUrl()}">← Back to projects</a>
            </div>
            <project-header project-id="${projectId}"></project-header>
            <project-canvas project-id="${projectId}"></project-canvas>
            <div class="project-view-tasks">
              <div class="project-view-tasks-header">
                <h3>Tasks</h3>
                <button class="btn btn-primary" onclick="${toggleAddTask}">+ Add Task</button>
              </div>
              ${addingTask &&
              html`
                <schema-form
                  endpoint="/api/tasks"
                  defaults="${JSON.stringify({ projectId })}"
                  onsubmit="${onTaskCreated}"
                  oncancel="${toggleAddTask}"
                ></schema-form>
              `}
              <task-list project-id="${projectId}"></task-list>
            </div>
          </div>
        `,
      ),
    shadow: false,
  },
});
