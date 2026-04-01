/**
 * Project header organism — condensed single-line project info with edit.
 * @module components/organisms/project-header
 */

import { html, define, store } from 'hybrids';
import ProjectModel from '../../../store/ProjectModel.js';
import { statusColor, statusTitle } from '../../../utils/statusColors.js';
import { formatDate } from '../../../utils/formatDate.js';
import '../../atoms/app-badge/app-badge.js';
import '../schema-form/schema-form.js';

/**
 * @typedef {Object} ProjectHeaderHost
 * @property {string} projectId
 * @property {import('../../../store/ProjectModel.js').Project} project
 * @property {boolean} editing
 */

/** @type {import('hybrids').Component<ProjectHeaderHost>} */
export default define({
  tag: 'project-header',
  projectId: '',
  project: store(ProjectModel, { id: 'projectId' }),
  editing: false,
  render: {
    value: ({ project, projectId, editing }) => html`
      <div class="project-header">
        ${store.pending(project) && html`<div class="loading"><span class="spinner"></span></div>`}
        ${store.error(project) && html`<div class="error-message">Failed to load project.</div>`}
        ${store.ready(project) &&
        !editing &&
        html`
          <div class="project-header-row">
            <h2 class="project-header-name">${project.name}</h2>
            <span class="project-header-sep">—</span>
            <span class="project-header-desc">${project.description}</span>
            <span class="project-header-meta">${formatDate(project.createdAt)}</span>
            <app-badge
              label="${statusTitle(project.status)}"
              color="${statusColor(project.status)}"
            ></app-badge>
            <button
              class="btn btn-secondary btn-xs"
              onclick="${(host) => {
                host.editing = true;
              }}"
            >
              Edit
            </button>
          </div>
        `}
        ${editing &&
        html`
          <schema-form
            endpoint="/api/projects"
            entity-id="${projectId}"
            onsubmit="${(host) => {
              host.editing = false;
              store.clear(ProjectModel);
            }}"
            oncancel="${(host) => {
              host.editing = false;
            }}"
          ></schema-form>
        `}
      </div>
    `,
    shadow: false,
  },
});
