/**
 * Get mouse position relative to the canvas content, accounting for pan offset.
 * @module utils/canvasPos
 */

import { getOffset } from './canvasViewport.js';

/**
 * Get mouse position in canvas content coordinates.
 * @param {SVGSVGElement} svg
 * @param {MouseEvent} event
 * @returns {{ x: number, y: number }}
 */
export function canvasPos(svg, event) {
  const r = svg.getBoundingClientRect();
  const o = getOffset();
  return { x: event.clientX - r.left - o.x, y: event.clientY - r.top - o.y };
}
