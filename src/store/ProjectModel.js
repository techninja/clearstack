/**
 * Project entity — enumerable, API-backed.
 * @module store/ProjectModel
 */

import { store } from 'hybrids';

const API = '/api/projects';

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {'active'|'archived'} status
 * @property {string} createdAt - ISO 8601
 */

/** @type {import('hybrids').Model<Project>} */
const ProjectModel = {
  id: true,
  name: '',
  description: '',
  status: 'active',
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

export default ProjectModel;
