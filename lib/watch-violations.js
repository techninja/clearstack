/**
 * Violation extraction and split candidate detection for the spec watch dashboard.
 * @module lib/watch-violations
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

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
    const errors = row.result.errors;
    // Prettier: [warn] src/file.js — expand each into its own entry
    const prettierFiles = errors.map((l) => l.match(/^\[warn\]\s+(.+\.\w+)$/)?.[1]).filter(Boolean);
    if (prettierFiles.length) return prettierFiles.map((f) => [f, 'formatting — run npm run format']);
    return [[row.label ?? row.name ?? row.key, errors.slice(0, 5).join('\n')]];
  }
  return [];
}
