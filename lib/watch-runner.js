/**
 * Watch runner — check execution, scheduling, and fix dispatch.
 * @module lib/watch-runner
 */

import { execSync } from 'node:child_process';
import { FAST_CHECKS } from './spec-config.js';
import { render, extractViolations } from './watch-ui.js';
import { setOnFix } from './watch-widgets.js';

/**
 * @param {object[]} specRows
 * @param {Set<string>} keys
 * @param {{ rows: object[], lastCheck: { value: string }, watchDirs: string[], currentViolations: { value: string[][] }, projectDir: string }} ctx
 */
export function runKeys(specRows, keys, ctx) {
  const { rows, lastCheck, watchDirs, currentViolations, projectDir } = ctx;
  const toRun = specRows.filter((r) => keys.has(r.key));
  if (!toRun.length) return;
  let i = 0;
  /**
   *
   */
  async function next() {
    if (i >= toRun.length) {
      const now = new Date();
      lastCheck.value = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      render(rows, lastCheck.value, watchDirs, currentViolations.value);
      return;
    }
    const row = toRun[i++];
    row.pass = null;
    row.detail = '';
    render(rows, lastCheck.value, watchDirs, currentViolations.value);
    const t0 = Date.now();
    const raw = await row.run({ quiet: true });
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1) + 's';
    row.result = typeof raw === 'boolean' ? { pass: raw } : raw;
    row.pass = row.result.pass;
    row.detail = row.pass
      ? `${row.result.detail ?? (row.result.files ? `${row.result.files} files` : '')} (${elapsed})`
      : (row.result.violations?.length
          ? `${row.result.violations.length} violation(s) (${elapsed})`
          : (() => { const errs = row.result.errors ?? []; const n = errs.filter((l) => /\.(js|ts|css|md)/.test(l)).length || errs.length; return `${n} error(s) (${elapsed})`; })());
    currentViolations.value = specRows.flatMap((r) => extractViolations(r, projectDir));
    render(rows, lastCheck.value, watchDirs, currentViolations.value);
    setImmediate(next);
  }
  setImmediate(next);
}

/**
 * @param {object[]} specRows
 * @param {object} ctx
 * @param {{ fast: Set<string>, slow: Set<string> }} pending
 * @param {{ fast: ReturnType<typeof setTimeout>|null, slow: ReturnType<typeof setTimeout>|null }} timers
 * @param {(keys: Set<string>) => void} run
 */
let fixing = false;

/**
 *
 */
export function schedule(specRows, ctx, pending, timers, run, checksForExt, ext) {
  if (fixing) return;
  for (const k of checksForExt(ext)) {
    const row = specRows.find((r) => r.key === k);
    if (row) row.pass = null;
    if (FAST_CHECKS.has(k)) pending.fast.add(k);
    else pending.slow.add(k);
  }
  render(ctx.rows, ctx.lastCheck.value, ctx.watchDirs, ctx.currentViolations.value);
  if (pending.fast.size) { clearTimeout(timers.fast); timers.fast = setTimeout(() => { const keys = new Set(pending.fast); pending.fast.clear(); run(keys); }, 50); }
  if (pending.slow.size) { clearTimeout(timers.slow); timers.slow = setTimeout(() => { const keys = new Set(pending.slow); pending.slow.clear(); run(keys); }, 1500); }
}

/**
 * @param {object[]} specRows
 * @param {object} cmds
 * @param {object} ctx
 * @param {{ slow: Set<string> }} pending
 * @param {{ slow: ReturnType<typeof setTimeout>|null }} timers
 * @param {(keys: Set<string>) => void} run
 */
export function setupFix(specRows, cmds, ctx, pending, timers, run) {
  setOnFix(() => {
    const fixable = specRows.filter((r) => !r.pass && (cmds.fix?.[r.key] || r.fix));
    if (!fixable.length) return;
    for (const row of fixable) {
      row.pass = null;
      pending.slow.add(row.key);
    }
    render(ctx.rows, ctx.lastCheck.value, ctx.watchDirs, ctx.currentViolations.value);
    fixing = true;
    for (const row of fixable) {
      try {
        if (row.fix) row.fix();
        else execSync(cmds.fix[row.key], { cwd: ctx.projectDir, stdio: 'pipe' });
      } catch { /* fixer may exit 1 even after fixing */ }
    }
    clearTimeout(timers.fast);
    clearTimeout(timers.slow);
    timers.slow = setTimeout(() => { fixing = false; const keys = new Set(pending.slow); pending.slow.clear(); run(keys); }, 2000);
  });
}
