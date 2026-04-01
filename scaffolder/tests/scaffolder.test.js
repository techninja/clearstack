import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { copyTemplates } from '../lib/copy.js';
import { writePackageJson } from '../lib/package-gen.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
let tmp;

before(() => { tmp = mkdtempSync(resolve(tmpdir(), 'hs-test-')); });
after(() => { rmSync(tmp, { recursive: true, force: true }); });

describe('copyTemplates', () => {
  it('copies shared template files', async () => {
    await copyTemplates(resolve(ROOT, 'templates'), 'shared', tmp, { name: 'test-app', port: '4000' });
    assert.ok(existsSync(resolve(tmp, 'README.md')));
    assert.ok(existsSync(resolve(tmp, '.env')));
    assert.ok(existsSync(resolve(tmp, 'public/index.html')));
  });

  it('replaces {{name}} in templates', async () => {
    const readme = readFileSync(resolve(tmp, 'README.md'), 'utf-8');
    assert.ok(readme.includes('test-app'));
    assert.ok(!readme.includes('{{name}}'));
  });

  it('replaces {{port}} in .env', async () => {
    const env = readFileSync(resolve(tmp, '.env'), 'utf-8');
    assert.ok(env.includes('PORT=4000'));
  });

  it('copies spec docs', async () => {
    assert.ok(existsSync(resolve(tmp, 'docs/CONVENTIONS.md')));
    assert.ok(existsSync(resolve(tmp, 'docs/COMPONENT_PATTERNS.md')));
  });

  it('copies config files', async () => {
    assert.ok(existsSync(resolve(tmp, '.configs/.prettierrc')));
    assert.ok(existsSync(resolve(tmp, '.configs/eslint.config.js')));
  });
});

describe('writePackageJson', () => {
  it('generates fullstack package.json with express', async () => {
    await writePackageJson(tmp, { name: 'test-app', description: 'Test', port: '4000', mode: 'fullstack' });
    const pkg = JSON.parse(readFileSync(resolve(tmp, 'package.json'), 'utf-8'));
    assert.equal(pkg.name, 'test-app');
    assert.ok(pkg.dependencies.express);
    assert.ok(pkg.dependencies.ws);
    assert.ok(pkg.scripts.start);
  });

  it('generates static package.json without express', async () => {
    await writePackageJson(tmp, { name: 'static-app', description: 'Test', port: '3000', mode: 'static' });
    const pkg = JSON.parse(readFileSync(resolve(tmp, 'package.json'), 'utf-8'));
    assert.equal(pkg.dependencies.express, undefined);
    assert.equal(pkg.dependencies.ws, undefined);
    assert.equal(pkg.scripts.start, undefined);
  });
});
