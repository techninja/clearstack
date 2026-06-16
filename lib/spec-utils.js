/**
 * Shared spec utilities — file scanning, command running, timing.
 * Used by both the clearstack CLI and the POC spec runner.
 * @module lib/spec-utils
 */

import { readFileSync, readdirSync } from 'node:fs';
import { resolve, extname, relative } from 'node:path';
import { execSync } from 'node:child_process';

/** @param {number} start */
export function elapsed(start) {
  const d = performance.now() - start;
  return d < 1000 ? `${Math.round(d)}ms` : `${(d / 1000).toFixed(1)}s`;
}

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
 * Count files matching extensions.
 * @param {string} root
 * @param {string[]} extensions
 * @param {string[]} ignoreDirs
 * @returns {number}
 */
export function countFiles(root, extensions, ignoreDirs) {
  return findFiles(root, extensions, ignoreDirs, root).length;
}

/** @typedef {{ pass: boolean, label: string, time: string, files?: number, errors?: string[] }} CheckResult */
/** @typedef {{ file: string, lines: number, max: number }} LineViolation */
/** @typedef {{ file: string, spec: string }} ImportViolation */

/**
 * Check file line counts with timing.
 * @param {string} root
 * @param {string[]} extensions
 * @param {number} max
 * @param {string[]} ignoreDirs
 * @param {string} label
 * @param {{ exclude?: string, include?: string, quiet?: boolean }} [filter]
 * @returns {CheckResult & { violations?: LineViolation[] }}
 */
export function checkFileLines(root, extensions, max, ignoreDirs, label, filter) {
  const start = performance.now();
  let files = findFiles(root, extensions, ignoreDirs, root);
  if (filter?.exclude) files = files.filter((f) => !f.endsWith(filter.exclude));
  if (filter?.include) files = files.filter((f) => f.endsWith(filter.include));
  const violations = [];
  for (const file of files) {
    const lines = readFileSync(resolve(root, file), 'utf-8').trimEnd().split('\n').length;
    if (lines > max) violations.push({ file, lines, max });
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
 * Check for relative parent imports (`../`) in browser-facing JS files.
 * Same-directory (`./`) and server/test files are allowed.
 * @param {string} root
 * @param {string[]} ignoreDirs
 * @param {string} label
 * @param {{ quiet?: boolean }} [opts]
 * @returns {CheckResult & { violations?: ImportViolation[] }}
 */
export function checkImports(root, ignoreDirs, label, opts) {
  const start = performance.now();
  const files = findFiles(root, ['.js'], ignoreDirs, root)
    .filter((f) => f.startsWith('src/') && !f.includes('vendor/') && !f.includes('api/') && !f.endsWith('.test.js') && !f.endsWith('server.js'));
  const violations = [];
  const importRe = /(?:^|\n)\s*import\s.*?from\s+['"](\.\.[^'"]*)['"]|(?:^|\n)\s*import\s+['"](\.\.[^'"]*)['"]|(?:^|\n)\s*export\s.*?from\s+['"](\.\.[^'"]*)['"/]/g;
  for (const file of files) {
    const src = readFileSync(resolve(root, file), 'utf-8');
    let m;
    while ((m = importRe.exec(src)) !== null) {
      const spec = m[1] || m[2] || m[3];
      violations.push({ file, spec });
    }
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


/**
 * Run a shell command, report pass/fail with timing.
 * @param {string} label
 * @param {string} cmd
 * @param {string} cwd
 * @param {string} [stats]
 * @param {{ quiet?: boolean }} [opts]
 * @returns {CheckResult}
 */
export function runCmd(label, cmd, cwd, stats, opts) {
  const start = performance.now();
  const suffix = (s) => s ? ` (${s}, ${elapsed(start)})` : ` (${elapsed(start)})`;
  try {
    execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf-8' });
    if (!opts?.quiet) console.log(`  ✅ ${label}${suffix(stats)}`);
    return { pass: true, label, time: elapsed(start), files: parseInt(stats) || undefined };
  } catch (err) {
    const out = (err.stdout || '') + (err.stderr || '');
    const ownErrors = out.trim().split('\n')
      .filter((l) => l.trim() && !l.includes('node_modules'));
    if (ownErrors.length === 0) {
      if (!opts?.quiet) console.log(`  ✅ ${label}${suffix(stats)}`);
      return { pass: true, label, time: elapsed(start) };
    }
    if (!opts?.quiet) {
      console.log(`  ❌ ${label}${suffix(stats)}`);
      for (const line of ownErrors) console.log(`     ${line}`);
    }
    return { pass: false, label, time: elapsed(start), errors: ownErrors };
  }
}
