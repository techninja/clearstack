/**
 * Server integration tests — static serving, schema discovery, validation.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start } from '../src/server.js';

const PORT = 3001;
const BASE = `http://localhost:${PORT}`;
let server;

before(async () => {
  server = start(PORT);
  await new Promise((r) => setTimeout(r, 100));
});

after(() => server?.close());

describe('static serving', () => {
  it('serves index.html at /', async () => {
    const res = await fetch(BASE);
    assert.equal(res.status, 200);
    assert.ok((await res.text()).includes('importmap'));
  });

  it('serves vendored hybrids', async () => {
    const res = await fetch(`${BASE}/vendor/hybrids/index.js`);
    assert.equal(res.status, 200);
    assert.ok((await res.text()).includes('export'));
  });

  it('serves src/ files', async () => {
    const res = await fetch(`${BASE}/src/styles/tokens.css`);
    assert.equal(res.status, 200);
  });
});

describe('schema discovery', () => {
  it('OPTIONS returns schema, layout, and methods for collection', async () => {
    const res = await fetch(`${BASE}/api/projects`, { method: 'OPTIONS' });
    const body = await res.json();
    assert.equal(body.schema.title, 'Project');
    assert.ok(body.layout.groups);
    assert.ok(body.methods.includes('POST'));
  });

  it('OPTIONS returns schema and methods for item', async () => {
    const res = await fetch(`${BASE}/api/projects/p1`, { method: 'OPTIONS' });
    const body = await res.json();
    assert.ok(body.methods.includes('PUT'));
    assert.ok(body.methods.includes('DELETE'));
  });

  it('GET ?schema=true still works', async () => {
    const res = await fetch(`${BASE}/api/projects?schema=true`);
    const schema = await res.json();
    assert.equal(schema.title, 'Project');
  });

  it('returns 404 for unknown entity', async () => {
    const res = await fetch(`${BASE}/api/unknown`, { method: 'OPTIONS' });
    assert.equal(res.status, 404);
  });
});

describe('validation', () => {
  it('rejects create with missing required fields (422)', async () => {
    const res = await fetch(`${BASE}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'No name' }),
    });
    assert.equal(res.status, 422);
    const body = await res.json();
    assert.ok(body.fields.name);
  });

  it('rejects invalid enum value (422)', async () => {
    const res = await fetch(`${BASE}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', status: 'invalid' }),
    });
    assert.equal(res.status, 422);
    assert.ok((await res.json()).fields.status);
  });

  it('allows partial update without required fields', async () => {
    const res = await fetch(`${BASE}/api/projects/p1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' }),
    });
    assert.equal(res.status, 200);
  });
});
