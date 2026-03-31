/**
 * Run a shell command and report pass/fail.
 * Shows output only on failure — keeps the spec runner clean.
 * @module scripts/spec-run
 */

import { execSync } from 'node:child_process';

/**
 * Run a command, report pass/fail. Output shown only on failure.
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
    console.log(`  ❌ ${label}`);
    const output = (err.stdout || '') + (err.stderr || '');
    if (output.trim()) {
      const lines = output.trim().split('\n');
      for (const line of lines) console.log(`     ${line}`);
    }
    return false;
  }
}
