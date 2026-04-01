/**
 * Canvas object transformations — move, resize, rotate.
 * @module utils/canvasTransform
 */

import { translatePath, scalePathTo } from './pathTransform.js';
import { shiftTransform, unrotate } from './parseTransform.js';

/**
 * Move any object by dx, dy (screen space).
 * For shapes with outer rotation, we move the rotation center and the inner translate together.
 * @param {object} o @param {number} dx @param {number} dy
 * @returns {object|null}
 */
export function moveObj(o, dx, dy) {
  const { id, type } = o;
  const rcx = o.rotationCx !== undefined ? o.rotationCx + dx : undefined;
  const rcy = o.rotationCy !== undefined ? o.rotationCy + dy : undefined;
  if (type === 'rect')
    return {
      id,
      type,
      x: o.x + dx,
      y: o.y + dy,
      w: o.w,
      h: o.h,
      rotation: o.rotation,
      rotationCx: rcx,
      rotationCy: rcy,
    };
  if (type === 'circle') return { id, type, cx: o.cx + dx, cy: o.cy + dy, r: o.r };
  if (type === 'text') return { ...o, x: o.x + dx, y: o.y + dy, rotationCx: rcx, rotationCy: rcy };
  if (type === 'line')
    return {
      id,
      type,
      x1: o.x1 + dx,
      y1: o.y1 + dy,
      x2: o.x2 + dx,
      y2: o.y2 + dy,
      rotation: o.rotation,
      rotationCx: rcx,
      rotationCy: rcy,
    };
  if (type === 'path') {
    if (o.shapeTransform)
      return {
        ...o,
        shapeTransform: shiftTransform(o.shapeTransform, dx, dy),
        rotationCx: rcx,
        rotationCy: rcy,
      };
    return {
      id,
      type,
      d: translatePath(o.d, dx, dy),
      rotation: o.rotation,
      rotationCx: rcx,
      rotationCy: rcy,
    };
  }
  if (type === 'shape')
    return {
      ...o,
      shapeTransform: shiftTransform(o.shapeTransform, dx, dy),
      rotationCx: rcx,
      rotationCy: rcy,
    };
  return null;
}

/**
 * Rotate object — angle delta from center.
 * @param {object} o
 * @param {{ x: number, y: number, w: number, h: number }} bounds
 * @param {number} startAngle @param {number} mx @param {number} my
 * @returns {object}
 */
export function rotateObj(o, bounds, startAngle, mx, my) {
  const cx = bounds.x + bounds.w / 2,
    cy = bounds.y + bounds.h / 2;
  const cur = Math.atan2(my - cy, mx - cx);
  const rotation = Math.round((o.rotation || 0) + (cur - startAngle) * (180 / Math.PI));
  return { ...o, rotation, rotationCx: cx, rotationCy: cy };
}

/**
 * Resize from a corner handle.
 * @param {object} o @param {string} handle
 * @param {number} dx @param {number} dy
 * @param {{ x: number, y: number, w: number, h: number }|null} bounds
 * @returns {object|null}
 */
export function resizeObj(o, handle, dx, dy, bounds) {
  if (!bounds) return null;
  const [ldx, ldy] = unrotate(dx, dy, o.rotation);
  let { x, y, w, h } = bounds;
  if (handle.includes('e')) w += ldx;
  if (handle.includes('w')) {
    x += ldx;
    w -= ldx;
  }
  if (handle.includes('s')) h += ldy;
  if (handle.includes('n')) {
    y += ldy;
    h -= ldy;
  }
  w = Math.max(w, 4);
  h = Math.max(h, 4);
  const { id, type } = o;
  if (type === 'rect') return { id, type, x, y, w, h, rotation: o.rotation };
  if (type === 'circle') return { id, type, cx: x + w / 2, cy: y + h / 2, r: Math.max(w, h) / 2 };
  if (type === 'line')
    return { id, type, x1: x, y1: y, x2: x + w, y2: y + h, rotation: o.rotation };
  if (type === 'path') {
    if (o.shapeTransform)
      return {
        ...o,
        shapeTransform: `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${(w / 100).toFixed(3)},${(h / 100).toFixed(3)})`,
      };
    return { id, type, d: scalePathTo(o.d, bounds, { x, y, w, h }), rotation: o.rotation };
  }
  if (type === 'shape')
    return {
      ...o,
      shapeTransform: `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${(w / 24).toFixed(3)},${(h / 24).toFixed(3)})`,
    };
  if (type === 'text') {
    const scale = bounds.h > 0 ? h / bounds.h : 1;
    return {
      ...o,
      x,
      y: y + h,
      fontSize: Math.max(8, Math.round((o.fontSize || 16) * scale)),
      rotation: o.rotation,
    };
  }
  return null;
}
