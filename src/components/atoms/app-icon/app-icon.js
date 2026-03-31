/**
 * Icon atom — renders inline SVG by name.
 * @module components/atoms/app-icon
 */

import { html, define } from 'hybrids';

/** SVG path data keyed by icon name. All use 24x24 viewBox. */
const ICONS = {
  plus: 'M12 4v16m-8-8h16',
  check: 'M5 13l4 4L19 7',
  trash: 'M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m2 0v14a2 2 0 01-2 2H8a2 2 0 01-2-2V6',
  x: 'M18 6L6 18M6 6l12 12',
  edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-7 0l9-9m-4 0h4v4',
  chevron: 'M9 5l7 7-7 7',
  folder: 'M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
  grip: 'M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01',
  list: 'M4 6h16M4 12h16M4 18h16',
  grid: 'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z',
  filter: 'M3 4h18l-7 8v5l-4 2V12L3 4z',
  settings:
    'M12 15a3 3 0 100-6 3 3 0 000 6zm7.94-2.06a1 1 0 00.2-1.1l-1.02-2.5a1 1 0 00-.93-.64h-.64',
};

/**
 * @typedef {Object} AppIconHost
 * @property {string} name - Icon name from the ICONS map
 * @property {'sm'|'md'|'lg'} size - Icon size class
 */

/** @type {import('hybrids').Component<AppIconHost>} */
export default define({
  tag: 'app-icon',
  name: '',
  size: 'md',
  render: {
    value: ({ name, size }) => {
      const path = ICONS[name];
      if (!path) return html`<span class="icon icon-${size}"></span>`;
      return html`
        <span class="icon icon-${size}">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="${path}"></path>
          </svg>
        </span>
      `;
    },
    shadow: false,
  },
});
