/**
 * Canvas drawing event handlers — produces objects from mouse interactions.
 * @module utils/canvasDrawing
 */

import { randomId } from './randomId.js';
import { canvasPos } from './canvasPos.js';

/** @type {{ tool: string, startX: number, startY: number, points: string, id: string } | null} */
let active = null;

/**
 * Get mouse position relative to the SVG element.
 * @param {SVGSVGElement} svg
 * @param {MouseEvent} event
 * @returns {{ x: number, y: number }}
 */
function pos(svg, event) {
  return canvasPos(svg, event);
}

/**
 * Start a drawing operation.
 * @param {SVGSVGElement} svg
 * @param {MouseEvent} event
 * @param {string} tool
 * @param {(msg: object) => void} send - WebSocket send
 */
export function drawStart(svg, event, tool, send) {
  const { x, y } = pos(svg, event);
  active = { tool, startX: x, startY: y, points: `M${x} ${y}`, id: randomId() };

  if (tool === 'pen') {
    send({ type: 'draw:start', id: active.id, x, y });
  }
}

/**
 * Continue a drawing operation (mousemove).
 * @param {SVGSVGElement} svg
 * @param {MouseEvent} event
 * @param {(msg: object) => void} send
 * @returns {object|null} Preview object for local rendering
 */
export function drawMove(svg, event, send) {
  if (!active) return null;
  const { x, y } = pos(svg, event);

  if (active.tool === 'pen') {
    active.points += ` L${x} ${y}`;
    send({ type: 'draw:point', id: active.id, x, y });
    return { type: 'path', id: active.id, d: active.points };
  }

  const dx = x - active.startX,
    dy = y - active.startY;
  if (active.tool === 'rect') {
    return {
      type: 'rect',
      id: active.id,
      x: Math.min(x, active.startX),
      y: Math.min(y, active.startY),
      w: Math.abs(dx),
      h: Math.abs(dy),
    };
  }
  if (active.tool === 'circle') {
    return {
      type: 'circle',
      id: active.id,
      cx: active.startX,
      cy: active.startY,
      r: Math.hypot(dx, dy),
    };
  }
  if (active.tool === 'line') {
    return { type: 'line', id: active.id, x1: active.startX, y1: active.startY, x2: x, y2: y };
  }
  return null;
}

/**
 * Finish a drawing operation (mouseup). Returns the final object.
 * @param {SVGSVGElement} svg
 * @param {MouseEvent} event
 * @returns {object|null}
 */
export function drawEnd(svg, event) {
  if (!active) return null;
  const { x, y } = pos(svg, event);
  const dx = x - active.startX,
    dy = y - active.startY;
  let obj = null;

  if (active.tool === 'pen') {
    active.points += ` L${x} ${y}`;
    obj = { type: 'path', id: active.id, d: active.points };
  } else if (active.tool === 'rect') {
    obj = {
      type: 'rect',
      id: active.id,
      x: Math.min(x, active.startX),
      y: Math.min(y, active.startY),
      w: Math.abs(dx),
      h: Math.abs(dy),
    };
  } else if (active.tool === 'circle') {
    obj = {
      type: 'circle',
      id: active.id,
      cx: active.startX,
      cy: active.startY,
      r: Math.hypot(dx, dy),
    };
  } else if (active.tool === 'line') {
    obj = { type: 'line', id: active.id, x1: active.startX, y1: active.startY, x2: x, y2: y };
  }

  active = null;
  return obj;
}

/** @returns {boolean} Whether a drawing operation is in progress. */
export function isDrawing() {
  return active !== null;
}
