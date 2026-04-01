/**
 * Run a shell command and report pass/fail.
 * Shows output only on failure — keeps the spec runner clean.
 * @module scripts/spec-run
 */

import { execSync } from 'node:child_process';

/**
 * Run a command, report pass/fail. Output shown only on failure.
 * Errors from node_modules are filtered (e.g. Express v5 type issues).
 * @param {string} label - Display name for this check
 * @param {string} cmd - Shell command to execute
 * @param {string} cwd - Working directory
 * @returns {boolean} true if command exited 0
 */
export function runCheck(label, cmd, cwd) {
  try {
    execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf-8' });
    console.log(`  ✅ ${label}`);
    return true;
  } catch (err) {
    const output = (err.stdout || '') + (err.stderr || '');
    const ownErrors = output
      .trim()
      .split('\n')
      .filter((l) => l.trim() && !l.includes('node_modules'));
    if (ownErrors.length === 0) {
      console.log(`  ✅ ${label}`);
      return true;
    }
    console.log(`  ❌ ${label}`);
    for (const line of ownErrors) console.log(`     ${line}`);
    return false;
  }
}
