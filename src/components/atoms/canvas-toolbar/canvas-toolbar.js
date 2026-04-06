/**
 * Canvas toolbar atom — tool selection + shapes picker for the whiteboard.
 * @module components/atoms/canvas-toolbar
 */

import { html, define, dispatch } from 'hybrids';
import { SHAPES } from '#utils/canvasShapes.js';
import '#atoms/app-icon/app-icon.js';

const TOOLS = [
  { id: 'select', icon: 'pointer', title: 'Select' },
  { id: 'pen', icon: 'pen', title: 'Pen' },
  { id: 'text', icon: 'text', title: 'Text' },
  { id: 'rect', icon: 'rect', title: 'Rectangle' },
  { id: 'circle', icon: 'circle', title: 'Circle' },
  { id: 'line', icon: 'line', title: 'Line' },
];

/**
 * @typedef {Object} CanvasToolbarHost
 * @property {string} activeTool
 * @property {boolean} shapesOpen
 */

/** @type {import('hybrids').Component<CanvasToolbarHost>} */
export default define({
  tag: 'canvas-toolbar',
  activeTool: 'select',
  shapesOpen: false,
  render: {
    value: ({ activeTool, shapesOpen }) => html`
      <div class="canvas-toolbar">
        ${TOOLS.map(
          (t) => html`
            <button
              class="canvas-tool ${activeTool === t.id ? 'active' : ''}"
              title="${t.title}"
              onclick="${(host) => {
                host.activeTool = t.id;
                host.shapesOpen = false;
                dispatch(host, 'tool-change', { detail: t.id, bubbles: true });
              }}"
            >
              <app-icon name="${t.icon}" size="sm"></app-icon>
            </button>
          `,
        )}
        <div class="shapes-wrap">
          <button
            class="canvas-tool ${shapesOpen || activeTool.startsWith('shape:') ? 'active' : ''}"
            title="Shapes"
            onclick="${(host) => {
              host.shapesOpen = !host.shapesOpen;
            }}"
          >
            <app-icon name="shapes" size="sm"></app-icon>
          </button>
          ${shapesOpen &&
          html`
            <div class="shapes-picker">
              ${SHAPES.map(
                (s) => html`
                  <button
                    class="shape-item ${activeTool === 'shape:' + s.id ? 'active' : ''}"
                    title="${s.name}"
                    onclick="${(host) => {
                      host.activeTool = 'shape:' + s.id;
                      host.shapesOpen = false;
                      dispatch(host, 'tool-change', { detail: 'shape:' + s.id, bubbles: true });
                    }}"
                  >
                    <app-icon name="${s.iconName}" size="sm"></app-icon>
                  </button>
                `,
              )}
            </div>
          `}
        </div>
      </div>
    `,
    shadow: false,
  },
});
