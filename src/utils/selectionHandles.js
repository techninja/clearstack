/**
 * Renders SVG selection handles — bounding box, resize corners, rotation band, delete button.
 * @module utils/selectionHandles
 */

import { objectBounds } from './renderSvgObject.js';
import { applyShapeTransform } from './parseTransform.js';

/**
 * Render selection handles for the selected object.
 * @param {object|undefined} obj
 * @param {SVGSVGElement} [svg]
 * @returns {string} SVG markup
 */
export function selectionHandles(obj, svg) {
  if (!obj) return '';
  let b = objectBounds(obj);
  if (!b && svg && obj.id) {
    const el = /** @type {SVGGraphicsElement|null} */ (
      svg.querySelector(`.canvas-obj[data-obj-id="${obj.id}"]`)
    );
    if (el) {
      try {
        const bb = el.getBBox();
        b = { x: bb.x, y: bb.y, w: bb.width, h: bb.height };
        if (obj.shapeTransform) b = applyShapeTransform(b, obj.shapeTransform);
      } catch (e) {
        console.warn('[canvas] selection handles failed:', e.message);
      }
    }
  }
  if (!b) return '';
  const { x, y, w, h } = b;
  const touch = 'ontouchstart' in globalThis;
  const hs = touch ? 20 : 10; // handle size
  const ho = hs / 2 + 2; // handle offset from corner
  const ds = touch ? 26 : 18; // delete button size
  const rcx = obj.rotationCx !== undefined ? obj.rotationCx : x + w / 2;
  const rcy = obj.rotationCy !== undefined ? obj.rotationCy : y + h / 2;
  const rot = obj.rotation ? `transform="rotate(${obj.rotation} ${rcx} ${rcy})"` : '';
  const handle = (dir, hx, hy) =>
    `<rect class="sel-handle" data-handle="${dir}" x="${hx}" y="${hy}" width="${hs}" height="${hs}" rx="2" />`;
  return `<g ${rot}>
    <rect class="sel-rotate" x="${x - 32}" y="${y - 32}" width="${w + 64}" height="${h + 64}"
      fill="transparent" stroke="none" data-rotate="${obj.id}" />
    <rect class="sel-body" x="${x}" y="${y}" width="${w}" height="${h}"
      fill="transparent" stroke="none" data-obj-id="${obj.id}" style="cursor:move" />
    <rect class="sel-box" x="${x - 4}" y="${y - 4}" width="${w + 8}" height="${h + 8}"
      fill="none" stroke="var(--color-primary)" stroke-width="1" stroke-dasharray="4"
      style="pointer-events:none" />
    ${handle('nw', x - ho, y - ho)}
    ${handle('ne', x + w - hs + ho, y - ho)}
    ${handle('sw', x - ho, y + h - hs + ho)}
    ${handle('se', x + w - hs + ho, y + h - hs + ho)}
    <g class="sel-delete" transform="translate(${x + w + 6}, ${y - ds - 4})">
      <rect width="${ds}" height="${ds}" rx="4" fill="var(--color-danger)" />
      <path d="M${ds * 0.28} ${ds * 0.28}L${ds * 0.72} ${ds * 0.72}M${ds * 0.72} ${ds * 0.28}L${ds * 0.28} ${ds * 0.72}" stroke="white" stroke-width="2" />
    </g>
  </g>`;
}
