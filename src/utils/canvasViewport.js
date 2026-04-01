/**
 * Canvas viewport — pan offset and touch event translation.
 * Two-finger drag pans the canvas.
 * Single touch only interacts when a tool is active or object is selected.
 * @module utils/canvasViewport
 */

/** @type {{ x: number, y: number }} */
const offset = { x: 0, y: 0 };

/** @type {{ x: number, y: number }|null} */
let pinch = null;

/** @type {boolean} */
let singleActive = false;

/**
 * Get the current pan offset.
 * @returns {{ x: number, y: number }}
 */
export function getOffset() {
  return { ...offset };
}

/**
 * Set up touch handlers on an SVG element.
 * @param {SVGSVGElement} svg
 * @param {(offset: { x: number, y: number }) => void} onPan
 * @param {() => boolean} shouldInteract - Returns true if single touch should draw/select
 */
export function setupTouch(svg, onPan, shouldInteract) {
  svg.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        singleActive = false;
        const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        pinch = { x: mx, y: my };
        return;
      }
      if (e.touches.length === 1 && shouldInteract()) {
        e.preventDefault();
        singleActive = true;
        dispatchMouse(svg, 'mousedown', e.touches[0]);
      }
    },
    { passive: false },
  );

  svg.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches.length === 2 && pinch) {
        e.preventDefault();
        const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        offset.x += mx - pinch.x;
        offset.y += my - pinch.y;
        pinch.x = mx;
        pinch.y = my;
        onPan(offset);
        return;
      }
      if (e.touches.length === 1 && singleActive) {
        e.preventDefault();
        dispatchMouse(svg, 'mousemove', e.touches[0]);
      }
    },
    { passive: false },
  );

  svg.addEventListener('touchend', (e) => {
    if (pinch && e.touches.length < 2) {
      pinch = null;
      return;
    }
    if (singleActive && e.changedTouches.length === 1) {
      dispatchMouse(svg, 'mouseup', e.changedTouches[0]);
      singleActive = false;
    }
  });
}

/**
 * @param {SVGSVGElement} svg
 * @param {string} type
 * @param {Touch} touch
 */
function dispatchMouse(svg, type, touch) {
  const el = document.elementFromPoint(touch.clientX, touch.clientY) || svg;
  el.dispatchEvent(
    new MouseEvent(type, {
      clientX: touch.clientX,
      clientY: touch.clientY,
      bubbles: true,
      cancelable: true,
    }),
  );
}
