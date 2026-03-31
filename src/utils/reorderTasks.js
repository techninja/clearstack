/**
 * Reorder tasks by updating sortOrder on the backend.
 * @module utils/reorderTasks
 */

/**
 * Update sortOrder for a list of task IDs in order.
 * @param {string[]} orderedIds - Task IDs in their new display order
 * @returns {Promise<void>}
 */
export async function reorderTasks(orderedIds) {
  await Promise.all(
    orderedIds.map((id, index) =>
      fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: index }),
      }),
    ),
  );
}
