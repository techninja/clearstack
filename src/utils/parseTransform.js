/**
 * Parse and apply shapeTransform to bounding boxes.
 * @module utils/parseTransform
 */

/**
 * Apply a shapeTransform string (translate + scale) to a bounding box.
 * @param {{ x: number, y: number, w: number, h: number }} b
 * @param {string} transform
 * @returns {{ x: number, y: number, w: number, h: number }}
 */
export function applyShapeTransform(b, transform) {
  let tx = 0,
    ty = 0,
    sx = 1,
    sy = 1;
  const tm = transform.match(/translate\(([-\d.]+),([-\d.]+)\)/);
  if (tm) {
    tx = parseFloat(tm[1]);
    ty = parseFloat(tm[2]);
  }
  const sm = transform.match(/scale\(([-\d.]+)(?:,([-\d.]+))?\)/);
  if (sm) {
    sx = parseFloat(sm[1]);
    sy = parseFloat(sm[2] || sm[1]);
  }
  return { x: b.x * sx + tx, y: b.y * sy + ty, w: b.w * sx, h: b.h * sy };
}

/**
 * Shift the translate() in a transform string by dx, dy.
 * @param {string} transform @param {number} dx @param {number} dy
 * @returns {string}
 */
export function shiftTransform(transform, dx, dy) {
  return transform.replace(
    /translate\(([\d.-]+),([\d.-]+)\)/,
    (_, tx, ty) =>
      `translate(${(parseFloat(tx) + dx).toFixed(1)},${(parseFloat(ty) + dy).toFixed(1)})`,
  );
}

/**
 * Convert screen-space deltas to local space for a rotated object.
 * @param {number} dx @param {number} dy @param {number} [rotation]
 * @returns {[number, number]}
 */
export function unrotate(dx, dy, rotation) {
  if (!rotation) return [dx, dy];
  const rad = (-rotation * Math.PI) / 180;
  return [dx * Math.cos(rad) - dy * Math.sin(rad), dx * Math.sin(rad) + dy * Math.cos(rad)];
}
