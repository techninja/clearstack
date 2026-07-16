/**
 * Spec compliance checker — check orchestration and resolution.
 * Config lives in spec-config.js, utilities in spec-utils.js.
 * @module lib/check
 */

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { runCmd } from './spec-utils.js';
import { countFiles, checkFileLines, checkImports } from './spec-scan.js';
import { checkI18n } from './spec-i18n.js';
import { loadConfig, buildCmds, detectRunner } from './spec-config.js';

export { runCmd, elapsed } from './spec-utils.js';
export { findFiles, countFiles, checkFileLines, checkImports } from './spec-scan.js';
export { checkI18n } from './spec-i18n.js';
export { loadConfig, buildCmds, detectRunner } from './spec-config.js';

/**
 * Load project-level spec extensions from `clearstack.spec.js` in the project root.
 * The file may export a default array of Check objects. Any check whose key matches
 * a built-in check replaces it; new keys are appended.
 * @param {string} projectDir
 * @returns {Promise<Check[]>}
 */
async function loadExtensions(projectDir) {
  const extPath = resolve(projectDir, 'clearstack.spec.js');
  if (!existsSync(extPath)) return [];
  try {
    const mod = await import(extPath);
    const exts = mod.default ?? [];
    if (!Array.isArray(exts)) {
      console.warn('⚠ clearstack.spec.js default export must be an array — extensions ignored');
      return [];
    }
    return exts;
  } catch (e) {
    console.warn(`⚠ Failed to load clearstack.spec.js: ${e.message}`);
    return [];
  }
}

/** @typedef {{ key: string, name: string, parent?: string, watchExts?: string[], run: (opts?: object) => (boolean | import('./spec-utils.js').CheckResult | Promise<import('./spec-utils.js').CheckResult>) }} Check */

/**
 * Merge cfg.ignore dirs into a jsconfig's exclude list and write a temp file.
 * This ensures SPEC_IGNORE_DIRS is the single source of truth for all checks.
 * @param {string} configPath  absolute path to the source jsconfig.json
 * @param {string[]} ignore    dirs from cfg.ignore
 * @returns {string}           path to the temp jsconfig to pass to tsc
 */
function mergedTypeConfig(configPath, ignore) {
  const base = JSON.parse(readFileSync(configPath, 'utf-8'));
  const root = dirname(configPath);
  const existing = base.exclude ?? [];
  const extra = ignore.map((d) => resolve(root, '..', d) + '/**');
  const merged = [...new Set([...existing, ...extra])];
  const out = { ...base, exclude: merged };
  const tmpDir = resolve(tmpdir(), 'clearstack-types');
  mkdirSync(tmpDir, { recursive: true });
  const tmpPath = resolve(tmpDir, configPath.replace(/[/\\:]/g, '_') + '.json');
  writeFileSync(tmpPath, JSON.stringify(out));
  return tmpPath;
}

/** Find all jsconfig.json files — main config + subdirectories. */
function findTypeConfigs(dir, runner, ignore) {
  const main = resolve(dir, '.configs/jsconfig.json');
  const configs = [];
  if (existsSync(main)) configs.push({ key: 'frontend', label: 'Frontend', path: main });
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const p = resolve(dir, entry.name, 'jsconfig.json');
    if (existsSync(p)) configs.push({ key: entry.name, label: entry.name, path: p });
  }
  return configs.map((c) => {
    const merged = mergedTypeConfig(c.path, ignore);
    return {
      key: c.key, name: `JSDoc types — ${c.label}`, parent: 'types',
      run: (o) => runCmd(`Types (${c.label})`, `${runner} tsc --project ${merged} --noEmit`, dir, undefined, o),
    };
  });
}

/**
 * Build the unified checks array. Children have a `parent` key.
 * Extensions from clearstack.spec.js are merged in: same key = replace, new key = append.
 * @returns {Promise<Check[]>}
 */
export async function buildChecks(dir, cfg, cmds) {
  const js = () => countFiles(dir, ['.js'], cfg.ignore);
  const css = () => countFiles(dir, ['.css'], cfg.ignore);
  const md = () => countFiles(dir, ['.md'], cfg.ignore);
  const runner = detectRunner(dir);
  const builtin = [
    { key: 'es', name: 'ESLint', parent: 'lint',
      run: (o) => runCmd('ESLint', cmds.lint, dir, `${js()} files`, o) },
    { key: 'css', name: 'Stylelint', parent: 'lint',
      run: (o) => runCmd('Stylelint', cmds.stylelint, dir, `${css()} files`, o) },
    { key: 'md', name: 'Markdown lint', parent: 'lint',
      run: (o) => runCmd('Markdown', cmds.mdlint, dir, `${md()} files`, o) },
    { key: 'prettier', name: 'Prettier', parent: 'format',
      run: (o) => runCmd('Prettier', cmds.prettier, dir, `${js()} files`, o) },
    { key: 'lines', name: `Code (max ${cfg.codeMax} lines)`, parent: 'code',
      run: (o) => checkFileLines(dir, cfg.codeExt, cfg.codeMax, cfg.ignore, `Code (max ${cfg.codeMax} lines)`, { exclude: cfg.testPattern, ...o }) },
    { key: 'i18n', name: 'i18n readiness', parent: 'code',
      run: (o) => checkI18n(dir, cfg.ignore, 'i18n readiness', o) },
    { key: 'tests', name: `Tests (max ${cfg.testMax} lines)`,
      run: (o) => checkFileLines(dir, cfg.codeExt, cfg.testMax, cfg.ignore, `Tests (max ${cfg.testMax} lines)`, { include: cfg.testPattern, ...o }) },
    { key: 'docs', name: `Docs (max ${cfg.docsMax} lines)`,
      run: (o) => checkFileLines(dir, cfg.docsExt, cfg.docsMax, cfg.ignore, `Docs (max ${cfg.docsMax} lines)`, o) },
    { key: 'imports', name: 'Import map aliases (no ../ imports)',
      run: (o) => checkImports(dir, cfg.ignore, 'Import map aliases (no ../ imports)', o) },
    ...findTypeConfigs(dir, runner, cfg.ignore),
    { key: 'audit', name: 'Security audit',
      run: (o) => runCmd('Security audit', cmds.audit, dir, undefined, o) },
  ];
  const extensions = await loadExtensions(dir);
  if (!extensions.length) return builtin;
  const extKeys = new Set(extensions.map((e) => e.key));
  return [...builtin.filter((c) => !extKeys.has(c.key)), ...extensions];
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
    const ok = results.every((r) => typeof r === 'boolean' ? r : r.pass);
    if (!ok) process.exit(1);
    return;
  }

  console.log('🔍 Clearstack compliance checking now... 💙\n');
  const results = await Promise.all(checks.map((c) => c.run(opts)));
  const passes = results.map((r) => typeof r === 'boolean' ? r : r.pass);
  const passed = passes.filter(Boolean).length;
  console.log(`\n${'='.repeat(40)}`);
  console.log(`${passed}/${results.length} checks passed.`);
  if (passed < results.length) process.exit(1);
}
