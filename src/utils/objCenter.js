/**
 * Compute center points for canvas objects.
 * @module utils/objCenter
 */

/**
 * Get center point of an object, using d-string parsing for paths.
 * @param {object} obj
 * @param {SVGSVGElement} [svg]
 * @returns {{ x: number, y: number }}
 */
export function objCenter(obj, svg) {
  if (obj.type === 'rect') return { x: obj.x + obj.w / 2, y: obj.y + obj.h / 2 };
  if (obj.type === 'circle') return { x: obj.cx, y: obj.cy };
  if (obj.type === 'line') return { x: (obj.x1 + obj.x2) / 2, y: (obj.y1 + obj.y2) / 2 };
  if (obj.type === 'path') {
    if (svg) {
      const el = /** @type {SVGGraphicsElement|null} */ (
        svg.querySelector(`.canvas-obj[data-obj-id="${obj.id}"]`)
      );
      if (el) {
        try {
          const b = el.getBBox();
          return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
        } catch {
          /* not rendered */
        }
      }
    }
    return pathCenter(obj.d);
  }
  return { x: 0, y: 0 };
}

/**
 * Compute center from path d string by averaging coordinate pairs.
 * @param {string} d
 * @returns {{ x: number, y: number }}
 */
export function pathCenter(d) {
  const nums = (d || '').match(/[\d.]+/g);
  if (!nums || nums.length < 2) return { x: 0, y: 0 };
  let sx = 0,
    sy = 0,
    count = 0;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    sx += parseFloat(nums[i]);
    sy += parseFloat(nums[i + 1]);
    count++;
  }
  return count ? { x: sx / count, y: sy / count } : { x: 0, y: 0 };
}
