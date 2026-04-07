/**
 * Spec compliance checker — config, commands, and orchestration.
 * @module lib/check
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkFileLines, runCmd, countFiles, checkImports } from './spec-utils.js';

export { checkFileLines, runCmd, countFiles, findFiles, elapsed, checkImports } from './spec-utils.js';

/** Detect the project's package manager runner (npx, pnpm exec, yarn). */
function detectRunner(projectDir) {
  if (existsSync(resolve(projectDir, 'pnpm-lock.yaml'))) return 'pnpm exec';
  if (existsSync(resolve(projectDir, 'yarn.lock'))) return 'yarn';
  return 'npx';
}

/** @param {string} src */
function parseEnv(src) {
  const env = {};
  for (const line of src.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

/**
 * Load spec config from project .env.
 * @param {string} projectDir
 */
export function loadConfig(projectDir) {
  const envPath = resolve(projectDir, '.env');
  const env = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf-8')) : {};
  return {
    codeMax: parseInt(env.SPEC_CODE_MAX_LINES) || 150,
    docsMax: parseInt(env.SPEC_DOCS_MAX_LINES) || 500,
    codeExt: (env.SPEC_CODE_EXTENSIONS || '.js,.css').split(','),
    docsExt: (env.SPEC_DOCS_EXTENSIONS || '.md').split(','),
    ignore: (env.SPEC_IGNORE_DIRS || 'node_modules,src/vendor,.git,.configs').split(','),
  };
}

/** Build check commands for the detected package manager. */
export function buildCmds(projectDir) {
  const runner = detectRunner(projectDir);
  const audit = runner === 'pnpm exec' ? 'pnpm audit --prod' : 'npm audit --omit=dev';
  return {
    lint: `${runner} eslint --config .configs/eslint.config.js . --fix`,
    stylelint: `${runner} stylelint --config .configs/.stylelintrc.json "src/**/*.css" --fix`,
    prettier: `${runner} prettier --config .configs/.prettierrc --write src scripts`,
    mdlint: `${runner} markdownlint-cli2 --config .configs/.markdownlint.jsonc --fix "docs/**/*.md" "*.md"`,
    types: `${runner} tsc --project .configs/jsconfig.json`,
    audit,
  };
}


/** @typedef {{ key: string, name: string, parent?: string, run: () => boolean }} Check */

/** Build the unified checks array. Children have a `parent` key. */
export function buildChecks(dir, cfg, cmds) {
  const js = () => countFiles(dir, ['.js'], cfg.ignore);
  const css = () => countFiles(dir, ['.css'], cfg.ignore);
  const md = () => countFiles(dir, ['.md'], cfg.ignore);
  return [
    { key: 'es', name: 'ESLint', parent: 'lint',
      run: () => runCmd('ESLint', cmds.lint, dir, `${js()} files`) },
    { key: 'css', name: 'Stylelint', parent: 'lint',
      run: () => runCmd('Stylelint', cmds.stylelint, dir, `${css()} files`) },
    { key: 'md', name: 'Markdown lint', parent: 'lint',
      run: () => runCmd('Markdown', cmds.mdlint, dir, `${md()} files`) },
    { key: 'prettier', name: 'Prettier', parent: 'format',
      run: () => runCmd('Prettier', cmds.prettier, dir, `${js()} files`) },
    { key: 'code', name: `Code (max ${cfg.codeMax} lines)`,
      run: () => checkFileLines(dir, cfg.codeExt, cfg.codeMax, cfg.ignore, `Code (max ${cfg.codeMax} lines)`) },
    { key: 'docs', name: `Docs (max ${cfg.docsMax} lines)`,
      run: () => checkFileLines(dir, cfg.docsExt, cfg.docsMax, cfg.ignore, `Docs (max ${cfg.docsMax} lines)`) },
    { key: 'imports', name: 'Import map aliases (no ../ imports)',
      run: () => checkImports(dir, cfg.ignore, 'Import map aliases (no ../ imports)') },
    { key: 'types', name: 'JSDoc types (tsc --checkJs)',
      run: () => runCmd('JSDoc types', cmds.types, dir, `${js()} files`) },
    { key: 'audit', name: 'Security audit',
      run: () => runCmd('Security audit', cmds.audit, dir) },
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
export async function check(projectDir, scope) {
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
    const ok = matched.every((c) => c.run());
    if (!ok) process.exit(1);
    return;
  }

  console.log('🔍 Clearstack compliance checking now... 💙\n');
  const results = checks.map((c) => c.run());
  const passed = results.filter(Boolean).length;
  console.log(`\n${'='.repeat(40)}`);
  console.log(`${passed}/${results.length} checks passed.`);
  if (passed < results.length) process.exit(1);
}
