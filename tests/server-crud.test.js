/**
 * Server integration tests — entity CRUD operations.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start } from '../src/server.js';
import { reload } from '../src/api/db.js';

const PORT = 0;
let BASE;
let server;

before(async () => {
  reload();
  server = start(PORT);
  const addr = server.address();
  BASE = `http://localhost:${addr.port}`;
  await new Promise((r) => setTimeout(r, 100));
});

after(() => server?.close());

describe('projects CRUD', () => {
  it('lists seed projects', async () => {
    const res = await fetch(`${BASE}/api/projects`);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(body.data));
    assert.equal(body.total, 2);
  });

  it('reads a single project', async () => {
    const res = await fetch(`${BASE}/api/projects/p1`);
    assert.equal((await res.json()).name, 'Website Redesign');
  });

  it('creates a project', async () => {
    const res = await fetch(`${BASE}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Project', description: 'Test' }),
    });
    assert.equal(res.status, 201);
    const project = await res.json();
    assert.ok(project.id);
    assert.ok(project.createdAt);
  });

  it('updates a project', async () => {
    const res = await fetch(`${BASE}/api/projects/p1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' }),
    });
    const updated = await res.json();
    assert.equal(updated.status, 'archived');
    assert.equal(updated.name, 'Website Redesign');
  });

  it('deletes a project', async () => {
    const res = await fetch(`${BASE}/api/projects/p2`, { method: 'DELETE' });
    assert.equal(res.status, 204);
    assert.equal((await fetch(`${BASE}/api/projects/p2`)).status, 404);
  });
});

describe('tasks CRUD', () => {
  it('lists tasks', async () => {
    const body = await (await fetch(`${BASE}/api/tasks`)).json();
    assert.ok(body.data.length >= 2);
  });

  it('filters tasks by projectId', async () => {
    const body = await (await fetch(`${BASE}/api/tasks?projectId=p1`)).json();
    assert.ok(body.data.every((t) => t.projectId === 'p1'));
  });

  it('sorts tasks', async () => {
    const res = await fetch(`${BASE}/api/tasks?sort=-priority`);
    assert.equal(res.status, 200);
  });

  it('returns 404 for missing task', async () => {
    assert.equal((await fetch(`${BASE}/api/tasks/nope`)).status, 404);
  });
});
