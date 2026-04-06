/**
 * Project canvas organism — collaborative SVG whiteboard.
 * @module components/organisms/project-canvas
 */

import { html, define } from 'hybrids';
import { connectCanvas } from '#utils/canvasSocket.js';
import { svgMarkup } from '#utils/renderSvgObject.js';
import { selectionHandles } from '#utils/selectionHandles.js';
import { applyCanvasMessage } from '#utils/canvasMessages.js';
import { onDown, onMove, onUp, deleteSelected } from '#utils/canvasEvents.js';
import { setupTouch } from '#utils/canvasViewport.js';
import '#atoms/canvas-toolbar/canvas-toolbar.js';

/**
 * @typedef {Object} ProjectCanvasHost
 * @property {string} projectId
 * @property {string} tool
 * @property {any[]} objects
 * @property {object|null} preview
 * @property {string} selectedId
 * @property {string} panTransform
 * @property {*} _conn
 */

/** @param {HTMLElement} host */
function getSvg(host) {
  return /** @type {SVGSVGElement} */ (host.querySelector('.canvas-svg'));
}

/** @type {import('hybrids').Component<ProjectCanvasHost>} */
export default define({
  tag: 'project-canvas',
  projectId: '',
  tool: 'pen',
  objects: { value: [] },
  preview: null,
  selectedId: '',
  panTransform: '',
  _conn: {
    value: undefined,
    /** @param {ProjectCanvasHost & HTMLElement} host */
    connect(host) {
      if (!host.projectId) return;
      const conn = connectCanvas(host.projectId, (msg) => {
        const updated = applyCanvasMessage(host.objects, msg);
        if (updated) {
          host.objects = updated;
          // Smart default: select tool if canvas has content, pen if empty
          if (msg.type === 'init') host.tool = updated.length > 0 ? 'select' : 'pen';
        }
      });
      host._conn = conn;

      // Keydown on host — persists across SVG re-renders
      host.setAttribute('tabindex', '0');
      host.style.outline = 'none';
      host.addEventListener('keydown', (e) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && host.selectedId) {
          e.preventDefault();
          deleteSelected(host);
        }
      });

      return () => conn.close();
    },
  },
  render: {
    value: (host) => {
      const { objects, preview, selectedId, panTransform } = host;
      const prevSvg = getSvg(host);
      const svgs = objects.map((o) => svgMarkup(o, selectedId, prevSvg)).join('');
      const prev = preview ? svgMarkup(preview, null) : '';
      const handles = selectedId
        ? selectionHandles(
            objects.find((o) => o.id === selectedId),
            prevSvg,
          )
        : '';
      const pan = panTransform ? ` transform="${panTransform}"` : '';
      return html`
        <div class="project-canvas">
          <canvas-toolbar
            active-tool="${host.tool}"
            ontool-change="${(h, e) => {
              h.tool = e.detail;
              h.selectedId = '';
            }}"
          >
          </canvas-toolbar>
          <div
            class="canvas-area ${host.tool === 'select' ? 'tool-select' : 'tool-draw'}"
            innerHTML="${`<svg class="canvas-svg" xmlns="http://www.w3.org/2000/svg"
              width="100%" height="100%"><g${pan}>${svgs}${prev}${handles}</g></svg>`}"
          ></div>
        </div>
      `;
    },
    observe(host) {
      const svg = getSvg(host);
      if (!svg || /** @type {any} */ (svg)._b) return;
      /** @type {any} */ (svg)._b = true;
      svg.addEventListener('mousedown', (e) => {
        host.focus();
        onDown(host, e, svg);
      });
      svg.addEventListener('mousemove', (e) => onMove(host, e, svg));
      svg.addEventListener('mouseup', (e) => onUp(host, e, svg));
      setupTouch(
        svg,
        (o) => {
          host.panTransform = `translate(${o.x},${o.y})`;
        },
        () => host.tool !== 'select' || host.selectedId !== '',
      );
    },
    shadow: false,
  },
});
