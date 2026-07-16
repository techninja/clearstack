/**
 * Spec watch dashboard — continuous compliance monitoring.
 * Execution logic lives in watch-runner.js, UI in watch-ui.js.
 * @module lib/watch
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadConfig, buildCmds, makeExtMap } from './spec-config.js';
import { buildChecks } from './check.js';
import { render, renderNote } from './watch-ui.js';
import { spawnServer, detectServerCmd } from './server-proc.js';
import { setupLifecycle } from './watch-lifecycle.js';
import { runKeys, schedule, setupFix } from './watch-runner.js';

/**
 *
 */
function toRow(check) { return { ...check, pass: null, detail: '', result: null }; }

/**
 *
 */
export async function startWatch(projectDir) {
  const cfg = loadConfig(projectDir);
  const cmds = buildCmds(projectDir, { watch: true });
  const checks = await buildChecks(projectDir, cfg, cmds);
  const specRows = checks.map(toRow);
  const checksForExt = makeExtMap(checks);

  const watchDirs = (cfg.watchDirs ?? ['src', 'scripts', 'docs']).filter((d) => existsSync(resolve(projectDir, d)));

  const serverCmd = detectServerCmd(projectDir, cfg);
  const serverRow = serverCmd
    ? { key: 'server', label: 'server', status: 'starting', pass: null, detail: 'starting…', kill: () => {} }
    : null;
  const rows = serverRow ? [serverRow, ...specRows] : specRows;

  // Shared mutable state passed by reference into runner helpers
  const lastCheck = { value: 'never' };
  const currentViolations = { value: [] };
  const pending = { fast: new Set(), slow: new Set() };
  const timers = { fast: null, slow: null };
  const ctx = { rows, lastCheck, watchDirs, currentViolations, projectDir };

  const run = (keys) => runKeys(specRows, keys, ctx);

  if (serverCmd) {
    const proc = spawnServer(serverCmd, projectDir, cfg.rawEnv, () => {
      serverRow.status = proc.status;
      serverRow.pass = proc.pass;
      serverRow.detail = proc.detail;
      serverRow.kill = proc.kill;
      render(rows, lastCheck.value, watchDirs, currentViolations.value);
    });
  }

  render(rows, lastCheck.value, watchDirs, currentViolations.value);
  run(new Set(specRows.map((r) => r.key)));

  setupFix(specRows, cmds, ctx, pending, timers, run);

  setupLifecycle({
    serverRow, specRows, projectDir, watchDirs,
    schedule: (ext) => schedule(specRows, ctx, pending, timers, run, checksForExt, ext),
    renderNote: () => renderNote(rows, lastCheck.value, watchDirs),
  });
}
