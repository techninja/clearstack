#!/usr/bin/env node

/**
 * Sync spec docs from repo root into scaffolder templates.
 * Run before publish to ensure templates ship the latest docs.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(ROOT, 'docs');
const dest = resolve(ROOT, 'templates/shared/docs/clearstack');

mkdirSync(dest, { recursive: true });

const SKIP = new Set(['BUILD_LOG.md', 'PLATFORM_STACKING.md']);
const files = readdirSync(src).filter((f) => f.endsWith('.md') && !SKIP.has(f));
let synced = 0;

for (const file of files) {
  const content = readFileSync(join(src, file), 'utf-8');
  writeFileSync(join(dest, file), content);
  synced++;
}

console.log(`✓ Synced ${synced} doc(s) → scaffolder/templates/shared/docs/`);
