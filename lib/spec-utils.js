/**
 * Shared spec utilities — timing and command running.
 * File scanning lives in spec-scan.js.
 * @module lib/spec-utils
 */

import { execSync } from 'node:child_process';

/** @param {number} start */
export function elapsed(start) {
  const d = performance.now() - start;
  return d < 1000 ? `${Math.round(d)}ms` : `${(d / 1000).toFixed(1)}s`;
}

/** @typedef {{ pass: boolean, label: string, time: string, detail?: string, files?: number, errors?: string[], violations?: object[] }} CheckResult */

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
    const lines = out.trim().split('\n').filter((l) => l.trim());
    const ownErrors = lines.filter((l) => !/[/\\]node_modules[/\\]/.test(l));
    const isPrettier = cmd.includes('prettier');
    const display = isPrettier
      ? ownErrors.filter((l) => l.startsWith('[warn]') && !l.includes('Run Prettier'))
      : ownErrors;
    if (display.length === 0) {
      if (!opts?.quiet) console.log(`  ✅ ${label}${suffix(stats)}`);
      return { pass: true, label, time: elapsed(start) };
    }
    if (!opts?.quiet) {
      console.log(`  ❌ ${label}${suffix(stats)}`);
      for (const line of display) console.log(`     ${line}`);
    }
    return { pass: false, label, time: elapsed(start), errors: display };
  }
}
