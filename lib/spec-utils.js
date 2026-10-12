/**
 * Shared spec utilities — timing, result normalisation, and command running.
 * runExtCmd (for clearstack.spec.js extensions) lives in spec-utils-ext.js.
 * File scanning lives in spec-scan.js.
 * @module lib/spec-utils
 */

import { execSync } from 'node:child_process';

export { runExtCmd } from './spec-utils-ext.js';

/** @param {number} start */
export function elapsed(start) {
  const d = performance.now() - start;
  return d < 1000 ? `${Math.round(d)}ms` : `${(d / 1000).toFixed(1)}s`;
}

/** @typedef {{ pass: boolean, label: string, time: string, detail?: string, files?: number, errors?: string[], violations?: object[] }} CheckResult */

/**
 * Normalise any check return value to a CheckResult.
 * @param {boolean | object} r
 * @param {string} name
 * @param {string} time
 * @returns {CheckResult}
 */
export function normalise(r, name, time) {
  if (typeof r === 'boolean') return { pass: r, label: name, time };
  return { label: name, time, ...r };
}

/**
 * Print a single CheckResult line (✅/❌ + errors/violations).
 * @param {CheckResult} r
 */
export function printResult(r) {
  const detail = r.detail ? ` — ${r.detail}` : '';
  const files = r.files ? ` (${r.files} files, ${r.time})` : ` (${r.time})`;
  if (r.pass) {
    console.log(`  ✅ ${r.label}${r.detail ? detail + ` (${r.time})` : files}`);
  } else {
    const suffix = r.violations?.length
      ? ` — ${r.violations.length} violation(s):`
      : r.errors?.length
        ? ` — ${r.errors.length} error(s):`
        : '';
    console.log(`  ❌ ${r.label}${suffix} (${r.time})`);
    for (const v of r.violations ?? []) console.log(`     ${v.file ?? v}: ${v.lines} lines (max ${v.max})`);
    for (const e of r.errors ?? []) console.log(`     ${e}`);
    if (!r.violations?.length && !r.errors?.length) console.log(`     (no details)`);
  }
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
