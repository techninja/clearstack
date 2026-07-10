/**
 * App router shell — top-level component that manages view stack
 * and connects realtime SSE sync.
 * @module router
 */

import { html, define, router } from 'hybrids';
import { loadLocale } from '#utils/i18n.js';
import { connectRealtime } from '#utils/realtimeSync.js';
import ProjectModel from '#store/ProjectModel.js';
import TaskModel from '#store/TaskModel.js';
import HomeView from '#pages/home/home-view.js';

/**
 * @typedef {Object} AppRouterHost
 * @property {HTMLElement[]} stack - Router view stack
 * @property {undefined} i18n - Locale loader (managed by connect)
 * @property {undefined} realtime - SSE connection (managed by connect)
 */

/** @type {import('hybrids').Component<AppRouterHost>} */
export default define({
  tag: 'app-router',
  stack: router(HomeView, { url: '/' }),
  i18n: {
    value: undefined,
    connect() {
      loadLocale(navigator.language);
    },
  },
  realtime: {
    value: undefined,
    connect(_host) {
      const disconnect = connectRealtime('/api/events', {
        project: ProjectModel,
        task: TaskModel,
      });
      return disconnect;
    },
  },
  render: {
    value: ({ stack }) => html` <div class="app-router">${stack}</div> `,
    shadow: false,
  },
});
