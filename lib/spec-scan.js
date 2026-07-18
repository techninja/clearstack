/**
 * File scanning utilities — find, count, check lines, check imports.
 * @module lib/spec-scan
 */

import { readFileSync, readdirSync } from 'node:fs';
import { resolve, extname, relative } from 'node:path';
import { elapsed } from './spec-utils.js';

/** @typedef {import('./spec-utils.js').CheckResult} CheckResult */
/** @typedef {{ file: string, lines: number, max: number }} LineViolation */
/** @typedef {{ file: string, spec: string }} ImportViolation */

/** Recursively find files matching extensions, skipping ignored dirs. */
export function findFiles(dir, extensions, ignoreDirs, root = dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    const rel = relative(root, full);
    if (entry.isDirectory()) {
      if (ignoreDirs.some((ig) => entry.name === ig || rel === ig || rel.startsWith(ig + '/'))) continue;
      results.push(...findFiles(full, extensions, ignoreDirs, root));
    } else if (extensions.includes(extname(entry.name))) {
      results.push(rel);
    }
  }
  return results;
}

/**
 * @param {string} root
 * @param {string[]} extensions
 * @param {string[]} ignoreDirs
 * @returns {number}
 */
export function countFiles(root, extensions, ignoreDirs) {
  return findFiles(root, extensions, ignoreDirs, root).length;
}

/** @param {string} f @param {string | string[]} pat */
function matchesPat(f, pat) {
  return Array.isArray(pat) ? pat.some((p) => f.includes(p) || f.endsWith(p)) : f.endsWith(pat);
}

/**
 * @param {string} root
 * @param {string[]} extensions
 * @param {number} max
 * @param {string[]} ignoreDirs
 * @param {string} label
 * @param {{ exclude?: string | string[], include?: string | string[], localeMax?: number, quiet?: boolean }} [filter]
 * @returns {CheckResult & { violations?: LineViolation[] }}
 */
export function checkFileLines(root, extensions, max, ignoreDirs, label, filter) {
  const start = performance.now();
  let files = findFiles(root, extensions, ignoreDirs, root);
  if (filter?.exclude) files = files.filter((f) => !matchesPat(f, filter.exclude));
  if (filter?.include) files = files.filter((f) => matchesPat(f, filter.include));
  const localeMax = filter?.localeMax || max * 5;
  const violations = [];
  for (const file of files) {
    const lines = readFileSync(resolve(root, file), 'utf-8').trimEnd().split('\n').length;
    const limit = file.includes('/locales/') ? localeMax : max;
    if (lines > limit) violations.push({ file, lines, max: limit });
  }
  const time = elapsed(start);
  if (violations.length === 0) {
    if (!filter?.quiet) console.log(`  ✅ ${label} (${files.length} files, ${time})`);
    return { pass: true, label, time, files: files.length };
  }
  if (!filter?.quiet) {
    console.log(`  ❌ ${label} — ${violations.length} violation(s):`);
    for (const v of violations) console.log(`     ${v.file}: ${v.lines} lines (max ${v.max})`);
  }
  return { pass: false, label, time, files: files.length, violations };
}

/**
 * @param {string} root
 * @param {string[]} ignoreDirs
 * @param {string} label
 * @param {{ quiet?: boolean, ignore?: string[] }} [opts]
 * @returns {CheckResult & { violations?: ImportViolation[] }}
 */
export function checkImports(root, ignoreDirs, label, opts) {
  const start = performance.now();
  const extraIgnore = opts?.ignore ?? [];
  const files = findFiles(root, ['.js'], ignoreDirs, root)
    .filter((f) => f.startsWith('src/') && !f.includes('vendor/') && !f.includes('api/') && !f.endsWith('.test.js') && !f.endsWith('server.js'))
    .filter((f) => !extraIgnore.some((p) => f.includes(p)));
  const violations = [];
  const importRe = /(?:^|\n)\s*import\s.*?from\s+['"](\.\.[^'"]*)['"]/g;
  for (const file of files) {
    const src = readFileSync(resolve(root, file), 'utf-8');
    let m;
    while ((m = importRe.exec(src)) !== null) violations.push({ file, spec: m[1] });
  }
  const time = elapsed(start);
  if (violations.length === 0) {
    if (!opts?.quiet) console.log(`  ✅ ${label} (${files.length} files, ${time})`);
    return { pass: true, label, time, files: files.length };
  }
  if (!opts?.quiet) {
    console.log(`  ❌ ${label} — ${violations.length} violation(s):`);
    for (const v of violations) console.log(`     ${v.file}: import '${v.spec}' → use #prefix/ alias`);
  }
  return { pass: false, label, time, files: files.length, violations };
}
