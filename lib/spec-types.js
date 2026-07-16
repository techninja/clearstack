/**
 * JSDoc type check helpers — jsconfig discovery and SPEC_IGNORE_DIRS merging.
 * @module lib/spec-types
 */

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { runCmd } from './spec-utils.js';

/**
 * Merge cfg.ignore dirs into a jsconfig's exclude list and write a temp file.
 * Ensures SPEC_IGNORE_DIRS is the single source of truth for all checks.
 * @param {string} configPath
 * @param {string[]} ignore
 * @returns {string} path to temp jsconfig
 */
function mergedTypeConfig(configPath, ignore) {
  const base = JSON.parse(readFileSync(configPath, 'utf-8'));
  const root = dirname(configPath);
  const existing = base.exclude ?? [];
  const extra = ignore.map((d) => resolve(root, '..', d) + '/**');
  const out = { ...base, exclude: [...new Set([...existing, ...extra])] };
  const tmpDir = resolve(tmpdir(), 'clearstack-types');
  mkdirSync(tmpDir, { recursive: true });
  const tmpPath = resolve(tmpDir, configPath.replace(/[/\\:]/g, '_') + '.json');
  writeFileSync(tmpPath, JSON.stringify(out));
  return tmpPath;
}

/**
 * Find all jsconfig.json files and return type check descriptors.
 * @param {string} dir
 * @param {string} runner
 * @param {string[]} ignore
 * @returns {object[]}
 */
export function findTypeConfigs(dir, runner, ignore) {
  const main = resolve(dir, '.configs/jsconfig.json');
  const configs = [];
  if (existsSync(main)) configs.push({ key: 'frontend', label: 'Frontend', path: main });
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const p = resolve(dir, entry.name, 'jsconfig.json');
    if (existsSync(p)) configs.push({ key: entry.name, label: entry.name, path: p });
  }
  return configs.map((c) => {
    const merged = mergedTypeConfig(c.path, ignore);
    return {
      key: c.key, name: `JSDoc types — ${c.label}`, parent: 'types',
      run: (o) => runCmd(`Types (${c.label})`, `${runner} tsc --project ${merged} --noEmit`, dir, undefined, o),
    };
  });
}
