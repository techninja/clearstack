/**
 * Drag-to-reorder logic for list items.
 * All handlers use hybrids signature: (host, event).
 * Uses data-drag-id attributes on list item wrappers.
 * @module utils/dragReorder
 */

/** @type {string} */
let dragId = '';
/** @type {number} */
let dropIndex = -1;

/**
 * @param {EventTarget|null} target
 * @returns {HTMLElement|null}
 */
function findItem(target) {
  return /** @type {HTMLElement|null} */ (
    /** @type {HTMLElement} */ (target)?.closest('[data-drag-id]')
  );
}

/**
 * Get ordered IDs from the container, excluding the dragged item.
 * @param {HTMLElement} container
 * @returns {{ el: HTMLElement, id: string }[]}
 */
function getVisible(container) {
  return /** @type {HTMLElement[]} */ ([...container.querySelectorAll('[data-drag-id]')])
    .filter((el) => el.dataset.dragId !== dragId)
    .map((el) => ({ el, id: el.dataset.dragId || '' }));
}

/**
 * @param {HTMLElement} _host
 * @param {DragEvent} event
 */
export function onDragStart(_host, event) {
  const item = findItem(event.target);
  if (!item) return;
  dragId = item.dataset.dragId || '';
  dropIndex = -1;
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  requestAnimationFrame(() => {
    item.style.opacity = '0';
    item.style.maxHeight = '0';
    item.style.overflow = 'hidden';
    item.style.padding = '0';
    item.style.margin = '0';
    item.style.border = 'none';
  });
}

/**
 * @param {HTMLElement} _host
 * @param {DragEvent} event
 */
export function onDragOver(_host, event) {
  event.preventDefault();
  const container = /** @type {HTMLElement} */ (event.currentTarget);
  const visible = getVisible(container);
  const y = event.clientY;

  let newIndex = visible.length;
  for (let i = 0; i < visible.length; i++) {
    const rect = visible[i].el.getBoundingClientRect();
    if (y < rect.top + rect.height / 2) {
      newIndex = i;
      break;
    }
  }

  if (newIndex === dropIndex) return;
  dropIndex = newIndex;

  // Remove old indicator
  container.querySelector('.drag-drop-indicator')?.remove();

  // Insert indicator at the gap
  const indicator = document.createElement('div');
  indicator.className = 'drag-drop-indicator';
  if (newIndex < visible.length) {
    visible[newIndex].el.before(indicator);
  } else {
    container.append(indicator);
  }
}

/**
 * @param {HTMLElement} _host
 * @param {DragEvent} event
 */
export function onDragEnd(_host, event) {
  cleanup(/** @type {HTMLElement} */ (event.currentTarget));
}

/**
 * @param {DragEvent} event
 * @param {string[]} currentIds
 * @returns {string[]|null}
 */
export function resolveDrop(event, currentIds) {
  event.preventDefault();
  const movedId = dragId;
  const targetIndex = dropIndex;

  const container = /** @type {HTMLElement} */ (event.currentTarget);
  cleanup(container);

  if (!movedId || targetIndex === -1) return null;

  const ids = [...currentIds];
  const from = ids.indexOf(movedId);
  if (from === -1) return null;

  ids.splice(from, 1);
  ids.splice(targetIndex, 0, movedId);
  if (ids.every((id, i) => id === currentIds[i])) return null;
  return ids;
}

/** @param {HTMLElement} container */
function cleanup(container) {
  container.querySelector('.drag-drop-indicator')?.remove();
  for (const el of container.querySelectorAll('[data-drag-id]')) {
    /** @type {HTMLElement} */ (el).style.cssText = '';
  }
  dragId = '';
  dropIndex = -1;
}
