/**
 * SVG path d-string manipulation utilities.
 * @module utils/pathTransform
 */

/**
 * Translate all coordinates in a path d string by dx, dy.
 * @param {string} d
 * @param {number} dx
 * @param {number} dy
 * @returns {string}
 */
export function translatePath(d, dx, dy) {
  return d.replace(/[\d.]+\s+[\d.]+/g, (m) => {
    const [px, py] = m.split(/\s+/);
    return `${(parseFloat(px) + dx).toFixed(1)} ${(parseFloat(py) + dy).toFixed(1)}`;
  });
}

/**
 * Scale path coordinates from original bounds to new bounds.
 * @param {string} d
 * @param {{ x: number, y: number, w: number, h: number }} from
 * @param {{ x: number, y: number, w: number, h: number }} to
 * @returns {string}
 */
export function scalePathTo(d, from, to) {
  if (!from.w || !from.h) return d;
  return d.replace(/[\d.]+\s+[\d.]+/g, (m) => {
    const [px, py] = m.split(/\s+/);
    const nx = to.x + ((parseFloat(px) - from.x) / from.w) * to.w;
    const ny = to.y + ((parseFloat(py) - from.y) / from.h) * to.h;
    return `${nx.toFixed(1)} ${ny.toFixed(1)}`;
  });
}
