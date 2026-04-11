/**
 * Canvas selection interaction state — tracks drag mode and delegates to transforms.
 * @module utils/canvasSelect
 */

import { moveObj, rotateObj, resizeObj } from './canvasTransform.js';
import { applyShapeTransform } from './parseTransform.js';
import { canvasPos } from './canvasPos.js';

/** @type {{ mode: string, handle: string, startX: number, startY: number, startAngle: number, origBounds: any, orig: object }|null} */
let drag = null;

/** @param {SVGSVGElement} svg @param {MouseEvent} event */
function pos(svg, event) {
  return canvasPos(svg, event);
}

/** @param {SVGSVGElement} svg @param {string} id @param {any[]} objects */
function getBBox(svg, id, objects) {
  const el = /** @type {SVGGraphicsElement|null} */ (
    svg.querySelector(`.canvas-obj[data-obj-id="${id}"]`)
  );
  if (!el) return null;
  try {
    const b = el.getBBox();
    const box = { x: b.x, y: b.y, w: b.width, h: b.height };
    const obj = objects?.find((o) => o.id === id);
    return obj?.shapeTransform ? applyShapeTransform(box, obj.shapeTransform) : box;
  } catch (e) {
    console.warn('[canvas] selection bounds failed:', e.message);
    return null;
  }
}

/**
 * Handle mousedown in select mode.
 * @param {SVGSVGElement} svg @param {MouseEvent} event
 * @param {any[]} objects @param {string} selectedId
 * @returns {string} New selected ID
 */
export function selectDown(svg, event, objects, selectedId) {
  const el = /** @type {Element} */ (event.target);
  const handle = el.getAttribute('data-handle');
  const rotateId = el.getAttribute('data-rotate');
  const objId = el.closest('[data-obj-id]')?.getAttribute('data-obj-id') || '';
  const { x, y } = pos(svg, event);

  if (handle && selectedId) {
    const obj = objects.find((o) => o.id === selectedId);
    const bounds = getBBox(svg, selectedId, objects);
    if (obj)
      drag = {
        mode: 'resize',
        handle,
        startX: x,
        startY: y,
        startAngle: 0,
        orig: { ...obj },
        origBounds: bounds,
      };
    return selectedId;
  }
  if (rotateId && rotateId === selectedId) {
    const obj = objects.find((o) => o.id === selectedId);
    const bounds = getBBox(svg, selectedId, objects);
    if (obj && bounds) {
      const cx = bounds.x + bounds.w / 2,
        cy = bounds.y + bounds.h / 2;
      drag = {
        mode: 'rotate',
        handle: '',
        startX: x,
        startY: y,
        startAngle: Math.atan2(y - cy, x - cx),
        orig: { ...obj },
        origBounds: bounds,
      };
    }
    return selectedId;
  }
  if (objId && objId === selectedId) {
    const obj = objects.find((o) => o.id === selectedId);
    if (obj)
      drag = {
        mode: 'move',
        handle: '',
        startX: x,
        startY: y,
        startAngle: 0,
        orig: { ...obj },
        origBounds: null,
      };
    return selectedId;
  }
  if (objId) {
    const obj = objects.find((o) => o.id === objId);
    if (obj)
      drag = {
        mode: 'move',
        handle: '',
        startX: x,
        startY: y,
        startAngle: 0,
        orig: { ...obj },
        origBounds: null,
      };
    return objId;
  }
  return '';
}

/** @param {SVGSVGElement} svg @param {MouseEvent} event @returns {object|null} */
export function selectMove(svg, event) {
  if (!drag) return null;
  const { x, y } = pos(svg, event);
  const dx = x - drag.startX,
    dy = y - drag.startY;
  if (drag.mode === 'move') return moveObj(drag.orig, dx, dy);
  if (drag.mode === 'rotate') return rotateObj(drag.orig, drag.origBounds, drag.startAngle, x, y);
  return resizeObj(drag.orig, drag.handle, dx, dy, drag.origBounds);
}

/** @param {SVGSVGElement} svg @param {MouseEvent} event @returns {object|null} */
export function selectUp(svg, event) {
  const result = selectMove(svg, event);
  drag = null;
  return result;
}

/** @returns {boolean} */
export function isDragging() {
  return drag !== null;
}
