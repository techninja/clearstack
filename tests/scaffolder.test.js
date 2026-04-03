#!/usr/bin/env node

/**
 * Scaffolder integration test — scaffolds into a temp dir,
 * then validates the output passes prettier and has expected files.
 * @module tests/scaffolder
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { copyTemplates } from '../lib/copy.js';
import { writePackageJson } from '../lib/package-gen.js';

const ROOT = join(import.meta.dirname, '..');
let dest;

const vars = {
  name: 'test-app',
  description: 'Integration test scaffold',
  port: '3000',
  mode: 'fullstack',
  year: 2025,
};

before(() => {
  dest = mkdtempSync(join(tmpdir(), 'clearstack-test-'));
});

after(() => {
  rmSync(dest, { recursive: true, force: true });
});

describe('scaffold output', () => {
  before(async () => {
    const tpl = join(ROOT, 'templates');
    await copyTemplates(tpl, 'shared', dest, vars);
    await copyTemplates(tpl, vars.mode, dest, vars);
    await writePackageJson(dest, vars);
  });

  it('creates expected directories', () => {
    for (const dir of [
      'src',
      'src/public',
      'src/styles',
      'scripts',
      'docs/clearstack',
      'docs/app-spec',
      '.configs',
    ]) {
      assert.ok(existsSync(join(dest, dir)), `missing: ${dir}`);
    }
  });

  it('creates .gitignore from gitignore template', () => {
    assert.ok(existsSync(join(dest, '.gitignore')));
  });

  it('replaces template variables', () => {
    const html = readFileSync(join(dest, 'src/public/index.html'), 'utf-8');
    assert.ok(html.includes('test-app'), 'index.html should contain project name');
    assert.ok(!html.includes('{{'), 'index.html should have no unresolved {{}}');
  });

  it('generates valid package.json', () => {
    const pkg = JSON.parse(readFileSync(join(dest, 'package.json'), 'utf-8'));
    assert.equal(pkg.name, 'test-app');
    assert.equal(pkg.type, 'module');
    assert.ok(pkg.devDependencies['@techninja/clearstack']);
    assert.ok(pkg.dependencies.express);
    assert.equal(pkg.scripts.spec, 'clearstack');
  });

  it('passes prettier on all scaffolded files', () => {
    try {
      execSync(`npx prettier --config ${join(dest, '.configs/.prettierrc')} --check ${dest}`, {
        stdio: 'pipe',
        encoding: 'utf-8',
      });
    } catch (err) {
      const out = (err.stdout || '') + (err.stderr || '');
      assert.fail(`Prettier violations in scaffolded output:\n${out}`);
    }
  });
});

describe('scaffold static mode', () => {
  let staticDest;

  before(async () => {
    staticDest = mkdtempSync(join(tmpdir(), 'clearstack-static-'));
    const tpl = join(ROOT, 'templates');
    await copyTemplates(tpl, 'shared', staticDest, { ...vars, mode: 'static' });
    await copyTemplates(tpl, 'static', staticDest, { ...vars, mode: 'static' });
    await writePackageJson(staticDest, { ...vars, mode: 'static' });
  });

  after(() => {
    rmSync(staticDest, { recursive: true, force: true });
  });

  it('has a static server.js', () => {
    assert.ok(existsSync(join(staticDest, 'src/server.js')));
  });

  it('has dev script for static serving', () => {
    const pkg = JSON.parse(readFileSync(join(staticDest, 'package.json'), 'utf-8'));
    assert.ok(pkg.scripts.dev.includes('server.js'));
  });

  it('has no ws dependency', () => {
    const pkg = JSON.parse(readFileSync(join(staticDest, 'package.json'), 'utf-8'));
    assert.ok(!pkg.dependencies.ws);
  });
});
