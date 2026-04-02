/**
 * Run a shell command and report pass/fail with file counts.
 * Counts come from the filesystem, not tool output parsing.
 * @module scripts/spec-run
 */

import { execSync } from 'node:child_process';
import { findFiles } from './spec-check.js';

/**
 * Run a command, report pass/fail. Errors from node_modules are filtered.
 * @param {string} label - Display name for this check
 * @param {string} cmd - Shell command to execute
 * @param {string} cwd - Working directory
 * @param {string} [stats] - Optional stats string to append on pass
 * @returns {boolean} true if passed
 */
export function runCheck(label, cmd, cwd, stats) {
  const start = performance.now();
  const suffix = (s) => (s ? ` (${s}, ${ms(start)})` : ` (${ms(start)})`);
  try {
    execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf-8' });
    console.log(`  ✅ ${label}${suffix(stats)}`);
    return true;
  } catch (err) {
    const output = (err.stdout || '') + (err.stderr || '');
    const ownErrors = output
      .trim()
      .split('\n')
      .filter((l) => l.trim() && !l.includes('node_modules'));
    if (ownErrors.length === 0) {
      console.log(`  ✅ ${label}${suffix(stats)}`);
      return true;
    }
    console.log(`  ❌ ${label}${suffix(stats)}`);
    for (const line of ownErrors) console.log(`     ${line}`);
    return false;
  }
}

/** @param {number} start */
function ms(start) {
  const d = performance.now() - start;
  return d < 1000 ? `${Math.round(d)}ms` : `${(d / 1000).toFixed(1)}s`;
}

/** matching extensions in a project.
 * @param {string} root - Project root
 * @param {string[]} extensions - File extensions
 * @param {string[]} [dirs] - Subdirectories to search (relative to root)
 * @param {RegExp} [filter] - Optional regex to further filter filenames
 * @returns {number}
 */
export function countFiles(root, extensions, dirs, filter) {
  const ignore = ['node_modules', 'public/vendor', '.git', '.configs', 'templates'];
  let files;
  if (dirs) {
    files = dirs.reduce((acc, d) => {
      try {
        return acc.concat(findFiles(`${root}/${d}`, extensions, ignore, root));
      } catch {
        return acc;
      }
    }, []);
  } else {
    files = findFiles(root, extensions, ignore, root);
  }
  return filter ? files.filter((f) => filter.test(f)).length : files.length;
}
