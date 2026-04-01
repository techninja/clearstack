/**
 * Generic CRUD router for any entity registered in the schema map.
 * @module api/entities
 */

import { Router } from 'express';
import { schemas, getRecord, setRecord, deleteRecord, listRecords, createEntity } from './db.js';
import { broadcast } from './events.js';
import { validate } from './validate.js';

export const entityRouter = Router();

/** @param {string} plural */
const singular = (plural) => plural.replace(/s$/, '');

// --- OPTIONS: schema + methods ---

entityRouter.options('/:entity', (req, res) => {
  const entry = schemas.get(req.params.entity);
  if (!entry) return res.status(404).json({ error: 'Unknown entity' });
  res.set('Allow', 'OPTIONS, GET, POST');
  res.json({ schema: entry.schema, layout: entry.layout, methods: ['OPTIONS', 'GET', 'POST'] });
});

entityRouter.options('/:entity/:id', (req, res) => {
  const entry = schemas.get(req.params.entity);
  if (!entry) return res.status(404).json({ error: 'Unknown entity' });
  res.set('Allow', 'OPTIONS, GET, PUT, DELETE');
  res.json({
    schema: entry.schema,
    layout: entry.layout,
    methods: ['OPTIONS', 'GET', 'PUT', 'DELETE'],
  });
});

// --- List ---

entityRouter.get('/:entity', (req, res) => {
  const { entity } = req.params;

  if (req.query.schema === 'true') {
    const entry = schemas.get(entity);
    return entry ? res.json(entry.schema) : res.status(404).json({ error: 'Unknown entity' });
  }

  let items = listRecords(entity);
  if (!items.length && !schemas.has(entity)) {
    return res.status(404).json({ error: 'Unknown entity' });
  }

  for (const [key, val] of Object.entries(req.query)) {
    if (['limit', 'offset', 'sort', 'schema'].includes(key)) continue;
    items = items.filter((item) => item[key] === val);
  }

  if (req.query.sort) {
    const sortVal = /** @type {string} */ (req.query.sort);
    const desc = sortVal.startsWith('-');
    const field = desc ? sortVal.slice(1) : sortVal;
    items.sort((a, b) => {
      const av = a[field] ?? '';
      const bv = b[field] ?? '';
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return desc ? -cmp : cmp;
    });
  }

  const total = items.length;
  const offset = parseInt(/** @type {string} */ (req.query.offset)) || 0;
  const limit = parseInt(/** @type {string} */ (req.query.limit)) || 20;
  res.json({ data: items.slice(offset, offset + limit), total, limit, offset });
});

// --- Read ---

entityRouter.get('/:entity/:id', (req, res) => {
  const item = getRecord(req.params.entity, req.params.id);
  return item ? res.json(item) : res.status(404).json({ error: 'Not found' });
});

// --- Create ---

entityRouter.post('/:entity', (req, res) => {
  if (!schemas.has(req.params.entity)) return res.status(404).json({ error: 'Unknown entity' });
  const { valid, fields } = validate(req.params.entity, req.body);
  if (!valid) return res.status(422).json({ error: 'Validation failed', fields });
  const entity = createEntity(req.body);
  setRecord(req.params.entity, entity.id, entity);
  broadcast(singular(req.params.entity), entity.id, 'created');
  res.status(201).json(entity);
});

// --- Update ---

entityRouter.put('/:entity/:id', (req, res) => {
  const existing = getRecord(req.params.entity, req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { valid, fields } = validate(req.params.entity, req.body, true);
  if (!valid) return res.status(422).json({ error: 'Validation failed', fields });
  const updated = { ...existing, ...req.body, id: existing.id, createdAt: existing.createdAt };
  setRecord(req.params.entity, existing.id, updated);
  broadcast(singular(req.params.entity), existing.id, 'updated');
  res.json(updated);
});

// --- Delete ---

entityRouter.delete('/:entity/:id', (req, res) => {
  if (!deleteRecord(req.params.entity, req.params.id)) {
    return res.status(404).json({ error: 'Not found' });
  }
  broadcast(singular(req.params.entity), req.params.id, 'deleted');
  res.status(204).end();
});
