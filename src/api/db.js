/**
 * JSON file-backed database. Reads/writes data/db.json.
 * Seeds from data/seed.json if db.json doesn't exist.
 * @module api/db
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

export { schemas } from './schemas.js';

const DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../data');
const DB_PATH = resolve(DIR, 'db.json');
const SEED_PATH = resolve(DIR, 'seed.json');

/** Load the database from disk, or seed if missing. */
function load() {
  mkdirSync(DIR, { recursive: true });
  if (!existsSync(DB_PATH)) {
    const seed = existsSync(SEED_PATH) ? readFileSync(SEED_PATH, 'utf-8') : '{}';
    writeFileSync(DB_PATH, seed);
  }
  return JSON.parse(readFileSync(DB_PATH, 'utf-8'));
}

/** Write the full database to disk. */
function save() {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

const data = load();

/** @type {{ get(entity: string): Record<string, object> | undefined }} */
export const db = {
  get(entity) {
    return data[entity];
  },
};

/**
 * Get an entity record by id.
 * @param {string} entity
 * @param {string} id
 * @returns {object|undefined}
 */
export function getRecord(entity, id) {
  return data[entity]?.[id];
}

/**
 * Set an entity record and persist.
 * @param {string} entity
 * @param {string} id
 * @param {object} value
 */
export function setRecord(entity, id, value) {
  if (!data[entity]) data[entity] = {};
  data[entity][id] = value;
  save();
}

/**
 * Delete an entity record and persist.
 * @param {string} entity
 * @param {string} id
 * @returns {boolean}
 */
export function deleteRecord(entity, id) {
  if (!data[entity]?.[id]) return false;
  delete data[entity][id];
  save();
  return true;
}

/**
 * List all records for an entity.
 * @param {string} entity
 * @returns {object[]}
 */
export function listRecords(entity) {
  return data[entity] ? Object.values(data[entity]) : [];
}

/**
 * Generate a new entity with id and createdAt.
 * @param {object} values
 * @returns {object}
 */
export function createEntity(values) {
  return { ...values, id: randomUUID(), createdAt: new Date().toISOString() };
}
