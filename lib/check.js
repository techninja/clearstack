/**
 * Spec compliance checker — check orchestration and resolution.
 * Config lives in spec-config.js, utilities in spec-utils.js.
 * @module lib/check
 */

import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkFileLines, runCmd, countFiles, checkImports } from './spec-utils.js';
import { checkI18n } from './spec-i18n.js';
import { loadConfig, buildCmds, detectRunner } from './spec-config.js';

export { checkFileLines, runCmd, countFiles, findFiles, elapsed, checkImports } from './spec-utils.js';
export { checkI18n } from './spec-i18n.js';
export { loadConfig, buildCmds, detectRunner } from './spec-config.js';

/** @typedef {{ key: string, name: string, parent?: string, run: (opts?: object) => boolean }} Check */

/** Find all jsconfig.json files — main config + subdirectories. */
function findTypeConfigs(dir, runner) {
  const main = resolve(dir, '.configs/jsconfig.json');
  const configs = [];
  if (existsSync(main)) configs.push({ key: 'frontend', label: 'Frontend', path: main });
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const p = resolve(dir, entry.name, 'jsconfig.json');
    if (existsSync(p)) configs.push({ key: entry.name, label: entry.name, path: p });
  }
  return configs.map((c) => ({
    key: c.key, name: `JSDoc types — ${c.label}`, parent: 'types',
    run: () => runCmd(`Types (${c.label})`, `${runner} tsc --project ${c.path}`, dir).pass,
  }));
}

/**
 * Build the unified checks array. Children have a `parent` key.
 * @returns {Check[]}
 */
export function buildChecks(dir, cfg, cmds) {
  const js = () => countFiles(dir, ['.js'], cfg.ignore);
  const css = () => countFiles(dir, ['.css'], cfg.ignore);
  const md = () => countFiles(dir, ['.md'], cfg.ignore);
  const runner = detectRunner(dir);
  return [
    { key: 'es', name: 'ESLint', parent: 'lint',
      run: () => runCmd('ESLint', cmds.lint, dir, `${js()} files`).pass },
    { key: 'css', name: 'Stylelint', parent: 'lint',
      run: () => runCmd('Stylelint', cmds.stylelint, dir, `${css()} files`).pass },
    { key: 'md', name: 'Markdown lint', parent: 'lint',
      run: () => runCmd('Markdown', cmds.mdlint, dir, `${md()} files`).pass },
    { key: 'prettier', name: 'Prettier', parent: 'format',
      run: () => runCmd('Prettier', cmds.prettier, dir, `${js()} files`).pass },
    { key: 'lines', name: `Code (max ${cfg.codeMax} lines)`, parent: 'code',
      run: () => checkFileLines(dir, cfg.codeExt, cfg.codeMax, cfg.ignore, `Code (max ${cfg.codeMax} lines)`, { exclude: cfg.testPattern }).pass },
    { key: 'i18n', name: 'i18n readiness', parent: 'code',
      run: (runOpts) => checkI18n(dir, cfg.ignore, 'i18n readiness', runOpts).pass },
    { key: 'tests', name: `Tests (max ${cfg.testMax} lines)`,
      run: () => checkFileLines(dir, cfg.codeExt, cfg.testMax, cfg.ignore, `Tests (max ${cfg.testMax} lines)`, { include: cfg.testPattern }).pass },
    { key: 'docs', name: `Docs (max ${cfg.docsMax} lines)`,
      run: () => checkFileLines(dir, cfg.docsExt, cfg.docsMax, cfg.ignore, `Docs (max ${cfg.docsMax} lines)`).pass },
    { key: 'imports', name: 'Import map aliases (no ../ imports)',
      run: () => checkImports(dir, cfg.ignore, 'Import map aliases (no ../ imports)').pass },
    ...findTypeConfigs(dir, runner),
    { key: 'audit', name: 'Security audit',
      run: () => runCmd('Security audit', cmds.audit, dir).pass },
  ];
}

/** Resolve a scope like 'lint', 'lint es', or 'code' to runnable check(s). */
export function resolveChecks(checks, scope) {
  const [first, second] = scope.split(/\s+/);
  if (second) {
    const match = checks.find((c) => c.parent === first && c.key === second);
    return match ? [match] : null;
  }
  const children = checks.filter((c) => c.parent === first);
  if (children.length) return children;
  const exact = checks.find((c) => c.key === first && !c.parent);
  return exact ? [exact] : null;
}

/** All unique parent keys. */
export function parentKeys(checks) {
  return [...new Set(checks.filter((c) => c.parent).map((c) => c.parent))];
}

/** Run the full spec compliance check (used by clearstack CLI and scripts/spec.js). */
export async function check(projectDir, scope, opts) {
  const cfg = loadConfig(projectDir);
  const cmds = buildCmds(projectDir);
  const checks = buildChecks(projectDir, cfg, cmds);

  if (scope && scope !== 'all') {
    const matched = resolveChecks(checks, scope);
    if (!matched) {
      console.log(`Unknown check: ${scope}`);
      const tops = checks.filter((c) => !c.parent).map((c) => c.key);
      console.log(`Available: ${[...tops, ...parentKeys(checks)].join(', ')}`);
      process.exit(1);
    }
    const ok = matched.every((c) => c.run(opts));
    if (!ok) process.exit(1);
    return;
  }

  console.log('🔍 Clearstack compliance checking now... 💙\n');
  const results = checks.map((c) => c.run(opts));
  const passed = results.filter(Boolean).length;
  console.log(`\n${'='.repeat(40)}`);
  console.log(`${passed}/${results.length} checks passed.`);
  if (passed < results.length) process.exit(1);
}
