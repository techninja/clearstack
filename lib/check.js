/**
 * Spec compliance checker — check orchestration and resolution.
 * Config lives in spec-config.js, utilities in spec-utils.js.
 * @module lib/check
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { runCmd } from './spec-utils.js';
import { countFiles, checkFileLines, checkImports } from './spec-scan.js';
import { checkI18n } from './spec-i18n.js';
import { loadConfig, buildCmds, detectRunner } from './spec-config.js';
import { findTypeConfigs } from './spec-types.js';

export { runCmd, elapsed } from './spec-utils.js';
export { findFiles, countFiles, checkFileLines, checkImports } from './spec-scan.js';
export { checkI18n } from './spec-i18n.js';
export { loadConfig, buildCmds, detectRunner } from './spec-config.js';

/** @typedef {{ key: string, name: string, parent?: string, watchExts?: string[], fix?: () => void, run: (opts?: object) => (boolean | import('./spec-utils.js').CheckResult | Promise<import('./spec-utils.js').CheckResult>) }} Check */

/**
 *
 */
async function loadExtensions(projectDir) {
  const extPath = resolve(projectDir, 'clearstack.spec.js');
  if (!existsSync(extPath)) return [];
  try {
    const mod = await import(extPath);
    const exts = mod.default ?? [];
    if (!Array.isArray(exts)) { console.warn('⚠ clearstack.spec.js default export must be an array — extensions ignored'); return []; }
    return exts;
  } catch (e) {
    console.warn(`⚠ Failed to load clearstack.spec.js: ${e.message}`);
    return [];
  }
}

/** Build the unified checks array. Extensions from clearstack.spec.js are merged in. */
export async function buildChecks(dir, cfg, cmds) {
  const js = () => countFiles(dir, ['.js'], cfg.ignore);
  const css = () => countFiles(dir, ['.css'], cfg.ignore);
  const md = () => countFiles(dir, ['.md'], cfg.ignore);
  const runner = detectRunner(dir);
  const builtin = [
    { key: 'es',      name: 'ESLint',      parent: 'lint',   run: (o) => runCmd('ESLint',      cmds.lint,      dir, `${js()} files`, o) },
    { key: 'css',     name: 'Stylelint',   parent: 'lint',   run: (o) => runCmd('Stylelint',   cmds.stylelint, dir, `${css()} files`, o) },
    { key: 'md',      name: 'Markdown lint', parent: 'lint', run: (o) => runCmd('Markdown',    cmds.mdlint,    dir, `${md()} files`, o) },
    { key: 'prettier', name: 'Prettier',   parent: 'format', run: (o) => runCmd('Prettier',    cmds.prettier,  dir, `${js()} files`, o) },
    { key: 'lines',   name: `Code (max ${cfg.codeMax} lines)`, parent: 'code',
      run: (o) => checkFileLines(dir, cfg.codeExt, cfg.codeMax, cfg.ignore, `Code (max ${cfg.codeMax} lines)`, { exclude: cfg.testPattern, ...o }) },
    { key: 'i18n',    name: 'i18n readiness', parent: 'code', run: (o) => checkI18n(dir, cfg.ignore, 'i18n readiness', o) },
    { key: 'tests',   name: `Tests (max ${cfg.testMax} lines)`,
      run: (o) => checkFileLines(dir, cfg.codeExt, cfg.testMax, cfg.ignore, `Tests (max ${cfg.testMax} lines)`, { include: cfg.testPattern, ...o }) },
    { key: 'docs',    name: `Docs (max ${cfg.docsMax} lines)`,
      run: (o) => checkFileLines(dir, cfg.docsExt, cfg.docsMax, cfg.ignore, `Docs (max ${cfg.docsMax} lines)`, { exclude: cfg.docsIgnore.length ? cfg.docsIgnore : undefined, ...o }) },
    { key: 'imports', name: 'Import map aliases (no ../ imports)',
      run: (o) => checkImports(dir, cfg.ignore, 'Import map aliases (no ../ imports)', o) },
    ...findTypeConfigs(dir, runner, cfg.ignore),
    { key: 'audit',   name: 'Security audit', run: (o) => runCmd('Security audit', cmds.audit, dir, undefined, o) },
  ];
  const extensions = await loadExtensions(dir);
  if (!extensions.length) return builtin;
  const extKeys = new Set(extensions.map((e) => e.key));
  return [...builtin.filter((c) => !extKeys.has(c.key)), ...extensions];
}

/** Resolve a scope like 'lint', 'lint es', or 'code' to runnable check(s). */
export function resolveChecks(checks, scope) {
  const [first, second] = scope.split(/\s+/);
  if (second) { const match = checks.find((c) => c.parent === first && c.key === second); return match ? [match] : null; }
  const children = checks.filter((c) => c.parent === first);
  if (children.length) return children;
  const exact = checks.find((c) => c.key === first && !c.parent);
  return exact ? [exact] : null;
}

/** All unique parent keys. */
export function parentKeys(checks) {
  return [...new Set(checks.filter((c) => c.parent).map((c) => c.parent))];
}

/** Run the full spec compliance check. */
export async function check(projectDir, scope, opts) {
  const cfg = loadConfig(projectDir);
  const cmds = buildCmds(projectDir);
  const checks = await buildChecks(projectDir, cfg, cmds);
  if (scope && scope !== 'all') {
    const matched = resolveChecks(checks, scope);
    if (!matched) {
      console.log(`Unknown check: ${scope}`);
      const tops = checks.filter((c) => !c.parent).map((c) => c.key);
      console.log(`Available: ${[...tops, ...parentKeys(checks)].join(', ')}`);
      process.exit(1);
    }
    const results = await Promise.all(matched.map((c) => c.run(opts)));
    if (!results.every((r) => typeof r === 'boolean' ? r : r.pass)) process.exit(1);
    return;
  }
  console.log('🔍 Clearstack compliance checking now... 💙\n');
  const runnable = checks.filter((c) => !c.keyBinding);
  const results = await Promise.all(runnable.map((c) => c.run(opts)));
  const passed = results.filter((r) => typeof r === 'boolean' ? r : r.pass).length;
  console.log(`\n${'='.repeat(40)}`);
  console.log(`${passed}/${results.length} checks passed.`);
  if (passed < results.length) process.exit(1);
}
