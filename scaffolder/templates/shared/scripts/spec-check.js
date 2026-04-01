/**
 * Spec line-count checker. Scans files and reports violations.
 * @module scripts/spec-check
 */

import { readFileSync, readdirSync } from 'node:fs';
import { resolve, extname, relative } from 'node:path';

/**
 * @typedef {Object} Violation
 * @property {string} file - Relative file path
 * @property {number} lines - Actual line count
 * @property {number} max - Maximum allowed
 */

/**
 * Recursively find files matching extensions, skipping ignored dirs.
 * @param {string} dir - Root directory
 * @param {string[]} extensions - e.g. ['.js', '.css']
 * @param {string[]} ignoreDirs - Directory names or relative paths to skip
 * @param {string} root - Project root for relative paths
 * @returns {string[]} Matching file paths (relative)
 */
export function findFiles(dir, extensions, ignoreDirs, root = dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    const rel = relative(root, full);
    if (entry.isDirectory()) {
      if (ignoreDirs.some((ig) => entry.name === ig || rel === ig || rel.startsWith(ig + '/')))
        continue;
      results.push(...findFiles(full, extensions, ignoreDirs, root));
    } else if (extensions.includes(extname(entry.name))) {
      results.push(rel);
    }
  }
  return results;
}

/**
 * Check files against a max line count.
 * @param {string} root - Project root
 * @param {string[]} extensions - File extensions to check
 * @param {number} maxLines - Maximum allowed lines
 * @param {string[]} ignoreDirs - Directories to skip
 * @returns {{ violations: Violation[], checked: number }}
 */
export function checkFiles(root, extensions, maxLines, ignoreDirs) {
  const files = findFiles(root, extensions, ignoreDirs);
  const violations = [];

  for (const file of files) {
    const content = readFileSync(resolve(root, file), 'utf-8');
    const lines = content.trimEnd().split('\n').length;
    if (lines > maxLines) {
      violations.push({ file, lines, max: maxLines });
    }
  }

  return { violations, checked: files.length };
}

/**
 * Print results in compact format.
 * @param {string} label - e.g. "Code" or "Docs"
 * @param {{ violations: Violation[], checked: number }} result
 * @returns {boolean} true if all passed
 */
export function printResults(label, result) {
  const { violations, checked } = result;

  if (violations.length === 0) {
    console.log(`  ✅ ${label} (${checked} files)`);
    return true;
  }

  console.log(`  ❌ ${label} — ${violations.length} violation(s):`);
  for (const v of violations) {
    console.log(`     ${v.file}: ${v.lines} lines (max ${v.max})`);
  }
  return false;
}
