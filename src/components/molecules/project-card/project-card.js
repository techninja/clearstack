/**
 * Project card molecule — displays a project summary.
 * Composes: app-badge, app-icon.
 * @module components/molecules/project-card
 */

import { html, define, dispatch } from 'hybrids';
import { statusColor, statusTitle } from '#utils/statusColors.js';
import { timeAgo } from '#utils/formatDate.js';
import '#atoms/app-badge/app-badge.js';
import '#atoms/app-icon/app-icon.js';

/**
 * @typedef {Object} ProjectCardHost
 * @property {string} projectId
 * @property {string} name
 * @property {string} description
 * @property {'active'|'archived'} status
 * @property {string} createdAt - ISO 8601
 */

/** @param {ProjectCardHost & HTMLElement} host */
function handleSelect(host) {
  dispatch(host, 'select', { detail: { id: host.projectId }, bubbles: true });
}

/** @type {import('hybrids').Component<ProjectCardHost>} */
export default define({
  tag: 'project-card',
  projectId: '',
  name: '',
  description: '',
  status: 'active',
  createdAt: '',
  render: {
    value: ({ name, description, status, createdAt }) => html`
      <div class="project-card" onclick="${handleSelect}">
        <div class="project-card-top">
          <app-icon name="folder" size="sm"></app-icon>
          <strong class="project-card-name">${name}</strong>
          <app-badge label="${statusTitle(status)}" color="${statusColor(status)}"></app-badge>
        </div>
        <p class="project-card-desc">${description}</p>
        <span class="project-card-meta">${timeAgo(createdAt)}</span>
      </div>
    `,
    shadow: false,
  },
});
