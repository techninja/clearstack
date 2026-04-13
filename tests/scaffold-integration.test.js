#!/usr/bin/env node

/**
 * Full scaffold integration test — scaffolds a project, installs deps,
 * starts the server, loads in a browser, and checks for console errors.
 * Runs for both fullstack and static modes.
 * @module tests/scaffold-integration
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync, spawn } from 'node:child_process';
import { copyTemplates } from '../lib/copy.js';
import { writePackageJson } from '../lib/package-gen.js';
import { checkFileLines } from '../lib/check.js';

const ROOT = join(import.meta.dirname, '..');
const TIMEOUT = 120_000;

/**
 * Scaffold, install, start, and browser-test a project.
 * @param {string} mode
 */
function testMode(mode) {
  const testPort = mode === 'fullstack' ? '4567' : '4568';
  const vars = {
    name: `test-${mode}`, description: `Integration (${mode})`,
    port: testPort, mode, year: 2025,
  };
  let dest, proc, port;

  describe(`${mode} integration`, { timeout: TIMEOUT }, () => {
    before(async () => {
      dest = mkdtempSync(join(tmpdir(), `cs-int-${mode}-`));
      const tpl = join(ROOT, 'templates');
      await copyTemplates(tpl, 'shared', dest, vars);
      await copyTemplates(tpl, mode, dest, vars);
      await writePackageJson(dest, vars);
      const pkgPath = join(dest, 'package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      delete pkg.devDependencies['@techninja/clearstack'];
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      execSync('npm install --ignore-scripts', { cwd: dest, stdio: 'pipe', timeout: TIMEOUT });
      execSync('node scripts/setup.js', { cwd: dest, stdio: 'pipe', timeout: 30_000 });
    });

    after(() => {
      proc?.kill();
      rmSync(dest, { recursive: true, force: true });
    });

    it('passes file line limits', () => {
      const ignore = ['node_modules', 'src/vendor', '.git', '.configs'];
      assert.ok(checkFileLines(dest, ['.js', '.css'], 150, ignore, 'Code'));
      assert.ok(checkFileLines(dest, ['.md'], 500, ignore, 'Docs'));
    });

    it('starts the server', async () => {
      proc = spawn('node', ['src/server.js'], { cwd: dest });
      port = await new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('Server timeout')), 10_000);
        proc.stdout.on('data', (d) => {
          const m = d.toString().match(/localhost:(\d+)/);
          if (m) { clearTimeout(t); resolve(m[1]); }
        });
        proc.stderr.on('data', (d) => { clearTimeout(t); reject(new Error(d.toString())); });
      });
    });

    it('serves index.html', async () => {
      const res = await fetch(`http://localhost:${port}/`);
      assert.equal(res.status, 200);
      assert.ok((await res.text()).includes(`test-${mode}`));
    });

    it('serves CSS with correct MIME type', async () => {
      const res = await fetch(`http://localhost:${port}/styles/tokens.css`);
      assert.equal(res.status, 200);
      assert.ok(res.headers.get('content-type').includes('text/css'));
    });

    it('serves vendor JS', async () => {
      const res = await fetch(`http://localhost:${port}/vendor/hybrids/index.js`);
      assert.equal(res.status, 200);
      assert.ok((await res.text()).includes('export'));
    });

    it('loads in browser with no console errors', async () => {
      const { chromium } = await import('playwright');
      const browser = await chromium.launch();
      const page = await browser.newPage();
      const errors = [];
      page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
      page.on('pageerror', (err) => errors.push(err.message));
      await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
      await browser.close();
      assert.equal(errors.length, 0, `Browser errors:\n${errors.join('\n')}`);
    });
  });
}

testMode('fullstack');
testMode('static');
