/**
 * Spec watch dashboard — continuous compliance monitoring.
 * Runs affected checks on file change with 500ms debounce.
 * UI rendering lives in watch-ui.js.
 * @module lib/watch
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { loadConfig, buildCmds, makeExtMap, FAST_CHECKS } from './spec-config.js';
import { buildChecks } from './check.js';
import { render, extractViolations, renderNote } from './watch-ui.js';
import { spawnServer, detectServerCmd } from './server-proc.js';
import { setupLifecycle } from './watch-lifecycle.js';
import { setOnFix } from './watch-widgets.js';

/** Adapt a Check from buildChecks into a watch row (adds pass/detail/result state). */
function toRow(check) {
  return { ...check, pass: null, detail: '', result: null };
}

/**
 * Start the spec watch dashboard.
 * @param {string} projectDir
 */
export async function startWatch(projectDir) {
  const cfg = loadConfig(projectDir);
  const cmds = buildCmds(projectDir, { watch: true });
  const checks = await buildChecks(projectDir, cfg, cmds);
  const specRows = checks.map(toRow);
  const checksForExt = makeExtMap(checks);

  const watchDirs = ['src', 'scripts', 'docs'].filter((d) =>
    existsSync(resolve(projectDir, d)),
  );

  let lastCheck = 'never';
  let fastTimer = null;
  let slowTimer = null;
  /** @type {Set<string>} */
  const fastPending = new Set();
  /** @type {Set<string>} */
  const slowPending = new Set();

  // Render immediately — server spawns and checks run async behind it
  const serverCmd = detectServerCmd(projectDir, cfg);

  /** @type {import('./server-proc.js').ServerRow|null} */
  const serverRow = serverCmd ? { key: 'server', label: 'server', status: 'starting', pass: null, detail: 'starting…', kill: () => {} } : null;
  const rows = serverRow ? [serverRow, ...specRows] : specRows;

  /**
   *
   */
  function spawnAndWatch() {
    const proc = spawnServer(serverCmd, projectDir, cfg.rawEnv, () => {
      serverRow.status = proc.status;
      serverRow.pass = proc.pass;
      serverRow.detail = proc.detail;
      serverRow.kill = proc.kill;
      render(rows, lastCheck, watchDirs, currentViolations);
    });
  }
  if (serverCmd) spawnAndWatch();

  /** @type {string[][]} */
  let currentViolations = [];
  render(rows, lastCheck, watchDirs, currentViolations);

  /**
   *
   */
  function runKeys(keys) {
    const toRun = specRows.filter((r) => keys.has(r.key));
    if (!toRun.length) return;
    let i = 0;
    /**
     *
     */
    async function next() {
      if (i >= toRun.length) {
        const now = new Date();
        lastCheck = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        render(rows, lastCheck, watchDirs, currentViolations);
        return;
      }
      const row = toRun[i++];
      const raw = await row.run({ quiet: true });
      row.result = typeof raw === 'boolean' ? { pass: raw } : raw;
      row.pass = row.result.pass;
      row.detail = row.pass
        ? (row.result.detail ?? (row.result.files ? `${row.result.files} files` : ''))
        : (row.result.violations?.length
            ? `${row.result.violations.length} violation(s)`
            : (() => { const errs = row.result.errors ?? []; const n = errs.filter((l) => /\.(js|ts|css|md)/.test(l)).length || errs.length; return `${n} error(s)`; })());
      // Rebuild violations from all currently-failed rows
      currentViolations = specRows.flatMap((r) => extractViolations(r, projectDir));
      render(rows, lastCheck, watchDirs, currentViolations);
      setImmediate(next);
    }
    setImmediate(next);
  }

  /**
   *
   */
  function runFast() { const keys = new Set(fastPending); fastPending.clear(); runKeys(keys); }
  /**
   *
   */
  function runSlow() { const keys = new Set(slowPending); slowPending.clear(); runKeys(keys); }

  /**
   *
   */
  function schedule(ext) {
    for (const k of checksForExt(ext)) {
      if (FAST_CHECKS.has(k)) fastPending.add(k);
      else slowPending.add(k);
    }
    if (fastPending.size) { clearTimeout(fastTimer); fastTimer = setTimeout(runFast, 50); }
    if (slowPending.size) { clearTimeout(slowTimer); slowTimer = setTimeout(runSlow, 1500); }
  }

  runKeys(new Set(specRows.map((r) => r.key)));

  // f key — run fix commands for all currently-failing fixable checks
  setOnFix(() => {
    const fixable = specRows.filter((r) => !r.pass && cmds.fix?.[r.key]);
    if (!fixable.length) return;
    for (const row of fixable) {
      try { execSync(cmds.fix[row.key], { cwd: projectDir, stdio: 'pipe' }); } catch { /* linter may exit 1 even after fixing */ }
      slowPending.add(row.key);
    }
    clearTimeout(slowTimer);
    slowTimer = setTimeout(runSlow, 100);
  });

  setupLifecycle({
    serverRow, specRows, projectDir, watchDirs,
    schedule,
    renderNote: () => renderNote(rows, lastCheck, watchDirs),
  });
}
