#!/usr/bin/env node

/**
 * Tests for spec extension loading (clearstack.spec.js project-level extensions).
 * Covers: no extension file, valid extensions, replace-by-key, bad exports, load errors.
 * @module tests/spec-extensions
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildChecks } from '../lib/check.js';
import { loadConfig, buildCmds } from '../lib/spec-config.js';

const ROOT = join(import.meta.dirname, '..');

/** Minimal cfg/cmds so buildChecks doesn't need a real project. */
function minimalArgs(dir) {
  return {
    cfg: loadConfig(ROOT),
    cmds: buildCmds(ROOT),
    dir,
  };
}

/** Write a clearstack.spec.js into dir and return the path. */
function writeExt(dir, content) {
  writeFileSync(join(dir, 'clearstack.spec.js'), content, 'utf-8');
}

let tmp;

before(() => {
  tmp = mkdtempSync(join(tmpdir(), 'cs-spec-ext-'));
});

after(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('buildChecks — no extension file', () => {
  it('returns built-in checks only', async () => {
    const dir = mkdtempSync(join(tmp, 'no-ext-'));
    const { cfg, cmds } = minimalArgs(dir);
    const checks = await buildChecks(dir, cfg, cmds);
    assert.ok(checks.length > 0, 'should have built-in checks');
    assert.ok(checks.every((c) => typeof c.key === 'string'), 'all checks have a key');
    assert.ok(checks.every((c) => typeof c.run === 'function'), 'all checks have a run fn');
  });
});

describe('buildChecks — valid extension', () => {
  it('appends a new check under an existing parent', async () => {
    const dir = mkdtempSync(join(tmp, 'append-'));
    writeExt(dir, `export default [
      { key: 'php', name: 'PHP lint', parent: 'lint', run: () => true },
    ];`);
    const { cfg, cmds } = minimalArgs(dir);
    const checks = await buildChecks(dir, cfg, cmds);
    const php = checks.find((c) => c.key === 'php');
    assert.ok(php, 'php check should be present');
    assert.equal(php.parent, 'lint');
    assert.equal(php.name, 'PHP lint');
  });

  it('appends a new top-level check (no parent)', async () => {
    const dir = mkdtempSync(join(tmp, 'toplevel-'));
    writeExt(dir, `export default [
      { key: 'custom', name: 'Custom check', run: () => true },
    ];`);
    const { cfg, cmds } = minimalArgs(dir);
    const checks = await buildChecks(dir, cfg, cmds);
    const custom = checks.find((c) => c.key === 'custom');
    assert.ok(custom, 'custom check should be present');
    assert.equal(custom.parent, undefined);
  });

  it('replaces a built-in check when keys match', async () => {
    const dir = mkdtempSync(join(tmp, 'replace-'));
    writeExt(dir, `export default [
      { key: 'audit', name: 'Custom audit', run: () => true },
    ];`);
    const { cfg, cmds } = minimalArgs(dir);
    const checks = await buildChecks(dir, cfg, cmds);
    const audits = checks.filter((c) => c.key === 'audit');
    assert.equal(audits.length, 1, 'should not duplicate — only one audit check');
    assert.equal(audits[0].name, 'Custom audit', 'extension should replace built-in');
  });

  it('can replace a built-in child check and change its parent', async () => {
    const dir = mkdtempSync(join(tmp, 'replace-child-'));
    writeExt(dir, `export default [
      { key: 'es', name: 'ESLint + PHP', parent: 'lint', run: () => true },
    ];`);
    const { cfg, cmds } = minimalArgs(dir);
    const checks = await buildChecks(dir, cfg, cmds);
    const es = checks.filter((c) => c.key === 'es');
    assert.equal(es.length, 1);
    assert.equal(es[0].name, 'ESLint + PHP');
  });

  it('preserves all non-replaced built-in checks', async () => {
    const dir = mkdtempSync(join(tmp, 'preserve-'));
    writeExt(dir, `export default [
      { key: 'php', name: 'PHP lint', parent: 'lint', run: () => true },
    ];`);
    const { cfg, cmds } = minimalArgs(dir);
    const checks = await buildChecks(dir, cfg, cmds);
    // Assert stable built-in keys (excludes dynamic type-config keys like 'frontend')
    const stableKeys = ['es', 'css', 'md', 'prettier', 'lines', 'i18n', 'tests', 'docs', 'imports', 'audit'];
    for (const key of stableKeys) {
      assert.ok(checks.find((c) => c.key === key), `built-in key '${key}' should be preserved`);
    }
    assert.ok(checks.find((c) => c.key === 'php'));
  });
});

describe('buildChecks — malformed extension file', () => {
  it('ignores extension and returns built-ins when export is not an array', async () => {
    const dir = mkdtempSync(join(tmp, 'bad-export-'));
    writeExt(dir, `export default { key: 'php', name: 'PHP lint', run: () => true };`);
    const { cfg, cmds } = minimalArgs(dir);
    const checks = await buildChecks(dir, cfg, cmds);
    assert.ok(!checks.find((c) => c.key === 'php'), 'bad export should be ignored');
    assert.ok(checks.find((c) => c.key === 'audit'), 'built-ins should still be present');
  });

  it('ignores extension and returns built-ins on syntax error', async () => {
    const dir = mkdtempSync(join(tmp, 'syntax-err-'));
    writeExt(dir, `export default [ { key: 'php' BROKEN`);
    const { cfg, cmds } = minimalArgs(dir);
    const checks = await buildChecks(dir, cfg, cmds);
    assert.ok(checks.find((c) => c.key === 'audit'), 'built-ins should still be present after load error');
  });
});
