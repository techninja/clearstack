/**
 * Handles incoming canvas WebSocket messages, updating the objects array.
 * @module utils/canvasMessages
 */

/**
 * Apply a WebSocket message to the canvas objects array.
 * @param {any[]} objects - Current objects
 * @param {object} msg - Incoming message
 * @returns {any[]|null} Updated array, or null if no change
 */
export function applyCanvasMessage(objects, msg) {
  switch (msg.type) {
    case 'init':
      return (msg.objects || []).filter(isValidObject);
    case 'object:add':
      return [...objects, msg.object];
    case 'object:update':
      return objects.map((o) => (o.id === msg.object.id ? { ...o, ...msg.object } : o));
    case 'object:delete':
      return objects.filter((o) => o.id !== msg.id);
    case 'draw:start':
      return [...objects, { type: 'path', id: msg.id, d: `M${msg.x} ${msg.y}` }];
    case 'draw:point':
      return objects.map((o) => (o.id === msg.id ? { ...o, d: `${o.d} L${msg.x} ${msg.y}` } : o));
    default:
      return null;
  }
}

/**
 * Check if a canvas object has the minimum required fields.
 * @param {object} obj
 * @returns {boolean}
 */
function isValidObject(obj) {
  if (!obj || !obj.type || !obj.id) return false;
  if (obj.type === 'path' && !obj.d) return false;
  if (obj.type === 'shape' && !obj.svgContent) return false;
  if (obj.type === 'text' && !obj.text) return false;
  if (obj.type === 'rect' && (obj.w === undefined || obj.h === undefined)) return false;
  if (obj.type === 'circle' && obj.r === undefined) return false;
  if (obj.type === 'line' && (obj.x2 === undefined || obj.y2 === undefined)) return false;
  return true;
}
