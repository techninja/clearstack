/**
 * Spec watch UI — rendering and violation display.
 * Split candidate detection and violation extraction live in watch-violations.js.
 * Widget construction lives in watch-widgets.js.
 * @module lib/watch-ui
 */

import { screen, statusBox, divider, logBox, getSpin, getCopyNote } from './watch-widgets.js';

export { setQuit } from './watch-widgets.js';
export { splitCandidates, extractViolations } from './watch-violations.js';

// ── Row rendering ─────────────────────────────────────────────────────────────

/** @param {object} r */
function rowIcon(r) {
  if (r.key === 'server') {
    if (r.status === 'running')    return '{green-fg}ok{/}';
    if (r.status === 'crashed')    return '{red-fg}!{/} ';
    if (r.status === 'restarting') return '{yellow-fg}~{/} ';
    return '{grey-fg}' + getSpin() + '{/}';
  }
  if (r.pass === null) return '{grey-fg}' + getSpin() + '{/}';
  if (r.pass)          return '{green-fg}ok{/}';
  if (r.keyBinding)    return '{grey-fg}–{/} ';
  return '{red-fg}!{/} ';
}

/** @param {number} ms @returns {string} */
function timeAgo(ms) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

/** @param {object} r @param {number} w */
const rowLine = (r, w) => {
  const n = (r.label ?? r.name ?? r.key).padEnd(w);
  const isIdle = r.pass === false && r.keyBinding;
  const name = (!isIdle && r.pass === false) ? `{red-fg}${n}{/}` : n;
  const detail = isIdle
    ? `{grey-fg}${r.ranAt ? timeAgo(r.ranAt) : `press ${r.keyBinding} to run`}{/}`
    : (r.detail ? `{grey-fg}${r.detail}{/}` : '');
  return ` ${rowIcon(r)} ${name}  ${detail}`;
};

// ── Status box helpers ────────────────────────────────────────────────────────

/** @param {object[]} rows @param {string} lastCheck @param {string[]} watchDirs */
function statusContent(rows, lastCheck, watchDirs) {
  const w = Math.max(...rows.map((r) => (r.label ?? r.name ?? r.key).length));
  return [...rows.map((r) => rowLine(r, w)), '',
    `{grey-fg} watching ${watchDirs.join(', ')}   last check: ${lastCheck}{/}${getCopyNote()}`];
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Render the dashboard.
 * @param {object[]} rows
 * @param {string} lastCheck
 * @param {string[]} watchDirs
 * @param {string[][]} violations
 */
export function render(rows, lastCheck, watchDirs, violations) {
  const lines = statusContent(rows, lastCheck, watchDirs);
  statusBox.setContent(lines.join('\n'));
  statusBox.height = lines.length;

  const statusHeight = lines.length + 1;
  divider.top = statusHeight;
  logBox.top = statusHeight + 1;

  if (violations.length) {
    const logLines = ['{yellow-fg}─── Copy below into your LLM session ───{/}'];
    for (const [file, detail, ...candidates] of violations) {
      logLines.push('');
      logLines.push(`{cyan-fg}${file}{/}`);
      logLines.push(detail);
      if (candidates.length) {
        logLines.push('{grey-fg}Split candidates:{/}');
        for (const c of candidates) logLines.push(`{grey-fg}${c}{/}`);
      }
    }
    logBox.setContent(logLines.join('\n'));
    logBox.show();
    divider.show();
  } else {
    logBox.hide();
    divider.hide();
  }

  screen.render();
}

/** Tear down the blessed screen cleanly. */
export function destroyScreen() {
  screen.destroy();
}

/** Refresh just the status box — used for transient notes like copy confirmation. */
export function renderNote(rows, lastCheck, watchDirs) {
  statusBox.setContent(statusContent(rows, lastCheck, watchDirs).join('\n'));
  screen.render();
}
