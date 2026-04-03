/**
 * JSON file-backed database. In-memory with disk persistence on writes.
 * Call reload() to refresh from disk after external edits.
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

let data = loadFromDisk();

/** Read the database file from disk. Seeds if missing. */
function loadFromDisk() {
  mkdirSync(DIR, { recursive: true });
  if (!existsSync(DB_PATH)) {
    const seed = existsSync(SEED_PATH) ? readFileSync(SEED_PATH, 'utf-8') : '{}';
    writeFileSync(DB_PATH, seed);
  }
  return JSON.parse(readFileSync(DB_PATH, 'utf-8'));
}

/** Persist current state to disk. */
function save() {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

/** Reload from disk — call after external edits to db.json. */
export function reload() {
  const seed = existsSync(SEED_PATH) ? readFileSync(SEED_PATH, 'utf-8') : '{}';
  writeFileSync(DB_PATH, seed);
  data = JSON.parse(seed);
}

/** @type {{ get(entity: string): Record<string, object> | undefined }} */
export const db = {
  get(entity) {
    return data[entity];
  },
};

/** @param {string} entity @param {string} id */
export function getRecord(entity, id) {
  return data[entity]?.[id];
}

/** @param {string} entity @param {string} id @param {object} value */
export function setRecord(entity, id, value) {
  if (!data[entity]) data[entity] = {};
  data[entity][id] = value;
  save();
}

/** @param {string} entity @param {string} id @returns {boolean} */
export function deleteRecord(entity, id) {
  if (!data[entity]?.[id]) return false;
  delete data[entity][id];
  save();
  return true;
}

/** @param {string} entity @returns {object[]} */
export function listRecords(entity) {
  return data[entity] ? Object.values(data[entity]) : [];
}

/** @param {object} values @returns {object} */
export function createEntity(values) {
  return { ...values, id: randomUUID(), createdAt: new Date().toISOString() };
}
