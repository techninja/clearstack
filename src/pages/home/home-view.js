/**
 * Home page — lists all projects with create option.
 * Route: /
 * @module pages/home
 */

import { html, define, store, router } from 'hybrids';
import { t } from '#utils/i18n.js';
import ProjectModel from '#store/ProjectModel.js';
import { pageLayout } from '#templates/page-layout/page-layout.js';
import '#molecules/project-card/project-card.js';
import '#organisms/schema-form/schema-form.js';
import ProjectView from '#pages/project/project-view.js';

/**
 * @typedef {Object} HomeViewHost
 * @property {import('#store/ProjectModel.js').Project[]} projects
 * @property {boolean} creating
 */

/** @param {HomeViewHost & HTMLElement} host */
function toggleCreate(host) {
  host.creating = !host.creating;
}

/** @param {HomeViewHost & HTMLElement} host */
function onProjectCreated(host) {
  host.creating = false;
  store.clear([ProjectModel]);
}

/** @type {import('hybrids').Component<HomeViewHost>} */
export default define({
  tag: 'home-view',
  [router.connect]: { url: '/', stack: () => [ProjectView] },
  projects: store([ProjectModel]),
  creating: false,
  render: {
    value: ({ projects, creating }) =>
      pageLayout(
        t('project.allProjects'),
        html`
          <div class="home-view">
            <div class="home-view-header">
              <h2>${t('project.allProjects')}</h2>
              <button class="btn btn-primary" onclick="${toggleCreate}">
                ${t('project.newProject')}
              </button>
            </div>
            ${creating &&
            html`
              <schema-form
                endpoint="/api/projects"
                onsubmit="${onProjectCreated}"
                oncancel="${toggleCreate}"
              ></schema-form>
            `}
            ${
              /** @type {any} */ (store).pending(projects) &&
              html`
                <div class="loading"><span class="spinner"></span> ${t('general.loading')}</div>
              `
            }
            ${
              /** @type {any} */ (store).error(projects) &&
              html` <div class="error-message">${t('project.loadError')}</div> `
            }
            ${
              /** @type {any} */ (store).ready(projects) &&
              html`
                <div class="home-view-grid">
                  ${projects.map((p) =>
                    html`
                      <a href="${router.url(ProjectView, { projectId: p.id })}">
                        <project-card
                          project-id="${p.id}"
                          name="${p.name}"
                          description="${p.description}"
                          status="${p.status}"
                          created-at="${p.createdAt}"
                        ></project-card>
                      </a>
                    `.key(p.id),
                  )}
                </div>
              `
            }
          </div>
        `,
      ),
    shadow: false,
  },
});
