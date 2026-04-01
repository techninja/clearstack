/**
 * Stamp a Lucide icon shape onto the canvas at a click position.
 * @module utils/canvasStamp
 */

import { SHAPES } from './canvasShapes.js';
import { randomId } from './randomId.js';
import { canvasPos } from './canvasPos.js';

const STAMP_SIZE = 120;
const SCALE = STAMP_SIZE / 24; // Lucide uses 24x24 viewBox

/** @type {Record<string, string>|null} */
let iconCache = null;

/** Load icon cache — same source as app-icon. */
function getIcons() {
  if (iconCache) return Promise.resolve(iconCache);
  return fetch('/icons.json')
    .then((r) => r.json())
    .then((data) => {
      iconCache = data;
      return data;
    })
    .catch(() => {
      iconCache = {};
      return {};
    });
}

/**
 * Create a shape object at the given position.
 * @param {string} shapeId
 * @param {SVGSVGElement} svg
 * @param {MouseEvent} event
 * @returns {Promise<object|null>}
 */
export async function stampShape(shapeId, svg, event) {
  const shape = SHAPES.find((s) => s.id === shapeId);
  if (!shape) return null;

  const icons = await getIcons();
  const inner = icons[shape.iconName];
  if (!inner) return null;

  const { x: cx, y: cy } = canvasPos(svg, event);
  const ox = cx - STAMP_SIZE / 2;
  const oy = cy - STAMP_SIZE / 2;

  return {
    type: 'shape',
    id: randomId(),
    svgContent: inner,
    shapeTransform: `translate(${ox.toFixed(1)},${oy.toFixed(1)}) scale(${SCALE})`,
  };
}
