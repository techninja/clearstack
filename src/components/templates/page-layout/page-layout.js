/**
 * Page layout helper — returns a layout template with header + content area.
 * This is a function, not a component — avoids host context issues when
 * event handlers are used inside the content.
 * @module components/templates/page-layout
 */

import { html } from 'hybrids';
import '../../atoms/theme-toggle/theme-toggle.js';

/**
 * Wrap content in the standard page layout (header + main).
 * @param {string} pageTitle - Title shown in the header bar
 * @param {*} content - Template content for the main area
 * @returns {*} Layout template
 */
export function pageLayout(pageTitle, content) {
  return html`
    <div class="page-layout">
      <header class="page-layout-header">
        <a class="page-layout-brand" href="/">Tracker</a>
        <span class="page-layout-title">${pageTitle}</span>
        <theme-toggle></theme-toggle>
      </header>
      <main class="page-layout-content">${content}</main>
    </div>
  `;
}
