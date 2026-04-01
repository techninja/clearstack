/**
 * Canvas mouse event handlers — delegates to draw, select, stamp, and delete.
 * @module utils/canvasEvents
 */

import { drawStart, drawMove, drawEnd, isDrawing } from './canvasDrawing.js';
import { selectDown, selectMove, selectUp, isDragging } from './canvasSelect.js';
import { stampShape } from './canvasStamp.js';
import { canvasPos } from './canvasPos.js';
import { randomId } from './randomId.js';

/**
 * Delete the currently selected object.
 * @param {any} host - ProjectCanvasHost
 */
export function deleteSelected(host) {
  const id = host.selectedId;
  host.objects = host.objects.filter((o) => o.id !== id);
  host.selectedId = '';
  host._conn.send({ type: 'object:delete', id });
}

/**
 * @param {any} host
 * @param {MouseEvent} event
 * @param {SVGSVGElement} svg
 */
export function onDown(host, event, svg) {
  const el = /** @type {Element} */ (event.target);
  if (el.closest('.sel-delete')) {
    deleteSelected(host);
    return;
  }
  if (host.tool === 'select') {
    host.selectedId = selectDown(svg, event, host.objects, host.selectedId);
    return;
  }
  if (host.tool.startsWith('shape:')) {
    stampShape(host.tool.slice(6), svg, event).then((obj) => {
      if (obj) {
        host.objects = [...host.objects, obj];
        host._conn.send({ type: 'object:add', object: obj });
      }
    });
    return;
  }
  if (host.tool === 'text') {
    const el = /** @type {Element} */ (event.target);
    const existingId = el.closest('[data-obj-id]')?.getAttribute('data-obj-id') || '';
    const existing = existingId
      ? host.objects.find((o) => o.id === existingId && o.type === 'text')
      : null;
    const text = prompt('Enter text:', existing?.text || '');
    if (text === null) return;
    if (existing) {
      const updated = { ...existing, text };
      host.objects = host.objects.map((o) => (o.id === existing.id ? updated : o));
      host._conn.send({ type: 'object:update', object: updated });
    } else if (text) {
      const { x, y } = canvasPos(svg, event);
      const obj = { type: 'text', id: randomId(), x, y, text, fontSize: 16 };
      host.objects = [...host.objects, obj];
      host._conn.send({ type: 'object:add', object: obj });
    }
    return;
  }
  host.selectedId = '';
  drawStart(svg, event, host.tool, host._conn.send);
}

/**
 * @param {any} host
 * @param {MouseEvent} event
 * @param {SVGSVGElement} svg
 */
export function onMove(host, event, svg) {
  if (host.tool === 'select' && isDragging()) {
    const updated = selectMove(svg, event);
    if (updated) {
      host.objects = host.objects.map((o) => (o.id === updated.id ? { ...o, ...updated } : o));
      host._conn.send({ type: 'object:update', object: updated });
    }
    return;
  }
  if (isDrawing()) host.preview = drawMove(svg, event, host._conn.send);
}

/**
 * @param {any} host
 * @param {MouseEvent} event
 * @param {SVGSVGElement} svg
 */
export function onUp(host, event, svg) {
  if (host.tool === 'select' && isDragging()) {
    const final = selectUp(svg, event);
    if (final) {
      host.objects = host.objects.map((o) => (o.id === final.id ? { ...o, ...final } : o));
      host._conn.send({ type: 'object:update', object: final });
    }
    return;
  }
  if (!isDrawing()) return;
  const obj = drawEnd(svg, event);
  if (obj) {
    host.objects = [...host.objects, obj];
    host.preview = null;
    host._conn.send({ type: 'object:add', object: obj });
  }
}
