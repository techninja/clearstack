/**
 * Spec watch UI — rendering, split candidates, violation extraction.
 * Widget construction lives in watch-widgets.js.
 * @module lib/watch-ui
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { screen, statusBox, divider, logBox, getSpin, getCopyNote } from './watch-widgets.js';

export { setQuit } from './watch-widgets.js';

// ── Split candidate detection ─────────────────────────────────────────────────

/**
 * Suggest split seams for a file that exceeds the line limit.
 * Prefers `// SPLIT CANDIDATE:` comments, falls back to heuristics.
 * @param {string} filePath absolute path
 * @returns {string[]}
 */
export function splitCandidates(filePath) {
  if (!existsSync(filePath)) return [];
  const lines = readFileSync(filePath, 'utf-8').split('\n');
  const explicit = [];
  lines.forEach((l, i) => {
    const m = l.match(/\/\/\s*SPLIT CANDIDATE:\s*(.+)/i);
    if (m) explicit.push(`  L${i + 1}: ${m[1].trim()}`);
  });
  if (explicit.length) return explicit;

  const seams = [];
  lines.forEach((l, i) => {
    // Only exported functions/classes are meaningful split boundaries
    if (/^export (async function|function|class)/.test(l)) seams.push(i + 1);
  });
  if (seams.length < 2) return [];
  const suggestions = [];
  for (let i = 0; i < seams.length - 1 && suggestions.length < 3; i++) {
    const start = seams[i], end = seams[i + 1] - 1;
    if (end - start < 10) continue;
    // Peek at the function name for a more useful suggestion
    const nameMatch = lines[start - 1]?.match(/^export (?:async )?function (\w+)/);
    const hint = nameMatch ? `→ ${nameMatch[1]}()` : 'consider extracting';
    suggestions.push(`  L${start}-${end}: ${hint}`);
  }
  return suggestions;
}

// ── Violation extraction ──────────────────────────────────────────────────────

/**
 * Process a failed check row into violation tuples for the log panel.
 * @param {object} row
 * @param {string} projectDir
 * @returns {string[][]}
 */
export function extractViolations(row, projectDir) {
  if (row.pass) return [];
  if (row.result?.violations?.length) {
    return row.result.violations.map((v) => {
      if (v.spec !== undefined) return [v.file, `import '${v.spec}' → use #prefix/ alias`];
      const candidates = splitCandidates(resolve(projectDir, v.file));
      return [v.file, `${v.lines} lines (max ${v.max}, +${v.lines - v.max} over)`, ...candidates];
    });
  }
  if (row.result?.errors?.length) {
    return [[(row.label ?? row.name ?? row.key), row.result.errors.slice(0, 3).join('\n')]];
  }
  return [];
}

// ── Render ────────────────────────────────────────────────────────────────────

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
  return '{red-fg}!{/} ';
}

/**
 * Render the dashboard.
 * @param {object[]} rows
 * @param {string} lastCheck
 * @param {string[]} watchDirs
 * @param {string[][]} violations
 */
export function render(rows, lastCheck, watchDirs, violations) {
  const labelWidth = Math.max(...rows.map((r) => (r.label ?? r.name ?? r.key).length));
  const statusLines = rows.map((r) => {
    const name = (r.label ?? r.name ?? r.key).padEnd(labelWidth);
    const styled = r.pass === false ? `{red-fg}${name}{/}` : name;
    const detail = r.detail ? `{grey-fg}${r.detail}{/}` : '';
    return ` ${rowIcon(r)} ${styled}  ${detail}`;
  });
  statusLines.push('');
  statusLines.push(`{grey-fg} watching ${watchDirs.join(', ')}   last check: ${lastCheck}{/}${getCopyNote()}`);
  statusBox.setContent(statusLines.join('\n'));
  statusBox.height = statusLines.length;

  const statusHeight = statusLines.length + 1;
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
  const labelWidth = Math.max(...rows.map((r) => (r.label ?? r.name ?? r.key).length));
  const lines = [
    ...rows.map((r) => { const n = (r.label ?? r.name ?? r.key).padEnd(labelWidth); return ` ${rowIcon(r)} ${r.pass === false ? `{red-fg}${n}{/}` : n}  ${r.detail ? `{grey-fg}${r.detail}{/}` : ''}`; }),
    '',
    `{grey-fg} watching ${watchDirs.join(', ')}   last check: ${lastCheck}{/}${getCopyNote()}`,
  ];
  statusBox.setContent(lines.join('\n'));
  screen.render();
}
