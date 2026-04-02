#!/usr/bin/env node

/**
 * Test runner — finds and executes all .test.js files.
 * @module scripts/test
 */

import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, statSync } from 'node:fs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/** @param {string} dir @returns {string[]} */
function findTests(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.name === 'node_modules' || entry.name === 'public') continue;
    if (entry.isDirectory()) results.push(...findTests(full));
    else if (entry.name.endsWith('.test.js')) results.push(full);
  }
  return results;
}

const files = findTests(ROOT);
if (files.length === 0) {
  console.log('No test files found.');
  process.exit(0);
}

try {
  execSync(`node --test ${files.join(' ')}`, { cwd: ROOT, stdio: 'inherit' });
} catch {
  process.exit(1);
}
