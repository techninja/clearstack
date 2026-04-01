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
      } catch { /* not rendered */ }
    }
  }
  if (!b) return '';
  const { x, y, w, h } = b;
  const rcx = obj.rotationCx !== undefined ? obj.rotationCx : x + w / 2;
  const rcy = obj.rotationCy !== undefined ? obj.rotationCy : y + h / 2;
  const rot = obj.rotation ? `transform="rotate(${obj.rotation} ${rcx} ${rcy})"` : '';
  const handle = (dir, hx, hy) =>
    `<rect class="sel-handle" data-handle="${dir}" x="${hx}" y="${hy}" width="10" height="10" rx="2" />`;
  return `<g ${rot}>
    <rect class="sel-rotate" x="${x - 32}" y="${y - 32}" width="${w + 64}" height="${h + 64}"
      fill="transparent" stroke="none" data-rotate="${obj.id}" />
    <rect class="sel-body" x="${x}" y="${y}" width="${w}" height="${h}"
      fill="transparent" stroke="none" data-obj-id="${obj.id}" style="cursor:move" />
    <rect class="sel-box" x="${x - 4}" y="${y - 4}" width="${w + 8}" height="${h + 8}"
      fill="none" stroke="var(--color-primary)" stroke-width="1" stroke-dasharray="4"
      style="pointer-events:none" />
    ${handle('nw', x - 7, y - 7)}
    ${handle('ne', x + w - 3, y - 7)}
    ${handle('sw', x - 7, y + h - 3)}
    ${handle('se', x + w - 3, y + h - 3)}
    <g class="sel-delete" transform="translate(${x + w + 6}, ${y - 18})">
      <rect width="18" height="18" rx="4" fill="var(--color-danger)" />
      <path d="M5 5L13 13M13 5L5 13" stroke="white" stroke-width="2" />
    </g>
  </g>`;
}
