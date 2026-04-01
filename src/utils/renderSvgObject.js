/**
 * Renders canvas objects as SVG elements.
 * @module utils/renderSvgObject
 */

import { objCenter } from './objCenter.js';

/**
 * Convert a canvas object to SVG markup with a fat invisible hit area.
 * @param {object} obj @param {string|null} selectedId @param {SVGSVGElement} [svg]
 * @returns {string}
 */
export function svgMarkup(obj, selectedId, svg) {
  if (!obj || !obj.type || !obj.id) return '';
  const sel = obj.id === selectedId;
  const stroke = obj.stroke || 'var(--color-text)';
  const fill = obj.fill || 'none';
  const sw = obj.strokeWidth || 2;
  const cls = sel ? 'canvas-obj selected' : 'canvas-obj';
  const vis = `class="${cls}" data-obj-id="${obj.id}" stroke="${stroke}" fill="${fill}" stroke-width="${sw}"`;
  const hit = `data-obj-id="${obj.id}" stroke="transparent" fill="none" stroke-width="12" style="pointer-events:stroke"`;

  let rot = '';
  if (obj.rotation) {
    const cx = obj.rotationCx !== undefined ? obj.rotationCx : objCenter(obj, svg).x;
    const cy = obj.rotationCy !== undefined ? obj.rotationCy : objCenter(obj, svg).y;
    rot = ` transform="rotate(${obj.rotation} ${cx} ${cy})"`;
  }
  const tf = obj.shapeTransform ? ` transform="${obj.shapeTransform}"` : rot;
  const outerRot =
    obj.shapeTransform && obj.rotation
      ? (() => {
          const rcx = obj.rotationCx !== undefined ? obj.rotationCx : 0;
          const rcy = obj.rotationCy !== undefined ? obj.rotationCy : 0;
          return ` transform="rotate(${obj.rotation} ${rcx} ${rcy})"`;
        })()
      : '';

  switch (obj.type) {
    case 'path': {
      const p = `<path ${hit} d="${obj.d}"${tf} /><path ${vis} d="${obj.d}"${tf} />`;
      return outerRot ? `<g${outerRot}>${p}</g>` : p;
    }
    case 'shape': {
      const inner = `<g ${tf} data-obj-id="${obj.id}" style="pointer-events:bounding-box;cursor:pointer">
        <rect width="24" height="24" fill="transparent" stroke="none" data-obj-id="${obj.id}" />
        <g class="${cls}" data-obj-id="${obj.id}" stroke="${stroke}" fill="${fill}" stroke-width="${sw}"
          stroke-linecap="round" stroke-linejoin="round">${obj.svgContent}</g></g>`;
      return outerRot ? `<g${outerRot}>${inner}</g>` : inner;
    }
    case 'rect':
      return (
        `<rect ${hit} x="${obj.x}" y="${obj.y}" width="${obj.w}" height="${obj.h}"${rot} />` +
        `<rect ${vis} x="${obj.x}" y="${obj.y}" width="${obj.w}" height="${obj.h}" rx="2"${rot} />`
      );
    case 'circle':
      return (
        `<circle ${hit} cx="${obj.cx}" cy="${obj.cy}" r="${obj.r}" />` +
        `<circle ${vis} cx="${obj.cx}" cy="${obj.cy}" r="${obj.r}" />`
      );
    case 'line':
      return (
        `<line ${hit} x1="${obj.x1}" y1="${obj.y1}" x2="${obj.x2}" y2="${obj.y2}"${rot} />` +
        `<line ${vis} x1="${obj.x1}" y1="${obj.y1}" x2="${obj.x2}" y2="${obj.y2}"${rot} />`
      );
    case 'text': {
      const ts = `font-size:${obj.fontSize || 16}px;font-family:var(--font-sans);cursor:pointer;pointer-events:auto`;
      return `<text class="${cls}" data-obj-id="${obj.id}" x="${obj.x}" y="${obj.y}"
        fill="${obj.fill || 'var(--color-text)'}" style="${ts}"${rot}>${obj.text || ''}</text>`;
    }
    default:
      return '';
  }
}

/**
 * Get bounding box for a canvas object.
 * @param {object} obj
 * @returns {{ x: number, y: number, w: number, h: number }|null}
 */
export function objectBounds(obj) {
  switch (obj.type) {
    case 'rect':
      return { x: obj.x, y: obj.y, w: obj.w, h: obj.h };
    case 'circle':
      return { x: obj.cx - obj.r, y: obj.cy - obj.r, w: obj.r * 2, h: obj.r * 2 };
    case 'line': {
      const x = Math.min(obj.x1, obj.x2),
        y = Math.min(obj.y1, obj.y2);
      return { x, y, w: Math.abs(obj.x2 - obj.x1) || 1, h: Math.abs(obj.y2 - obj.y1) || 1 };
    }
    case 'path':
      return null;
    case 'text':
      return null;
    default:
      return null;
  }
}
