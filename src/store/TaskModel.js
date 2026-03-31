/**
 * Task entity — enumerable, API-backed.
 * Belongs to a Project via projectId.
 * @module store/TaskModel
 */

import { store } from 'hybrids';

const API = '/api/tasks';

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} projectId - Parent project ID
 * @property {string} title
 * @property {'todo'|'doing'|'done'} status
 * @property {'low'|'med'|'high'} priority
 * @property {number} sortOrder - Display order within project
 * @property {string} createdAt - ISO 8601
 */

/** @type {import('hybrids').Model<Task>} */
const TaskModel = {
  id: true,
  projectId: '',
  title: '',
  status: 'todo',
  priority: 'med',
  sortOrder: 0,
  createdAt: '',
  [store.connect]: {
    get: (id) => fetch(`${API}/${id}`).then((r) => r.json()),
    set: (id, values) =>
      id
        ? fetch(`${API}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
          }).then((r) => r.json())
        : fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
          }).then((r) => r.json()),
    list: (params) =>
      fetch(`${API}?${new URLSearchParams(/** @type {Record<string, string>} */ (params))}`)
        .then((r) => r.json())
        .then((r) => r.data),
  },
};

export default TaskModel;
