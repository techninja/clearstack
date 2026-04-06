/**
 * Spec compliance checker — config, commands, and orchestration.
 * Core utilities live in spec-utils.js.
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

/**
 * Build check commands for the detected package manager.
 * @param {string} runner
 */
function buildCmds(runner) {
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

/** @deprecated Use buildCmds() instead — kept for backward compat. */
export const CMDS = buildCmds('npx');

/**
 * Run the full spec compliance check (used by clearstack CLI).
 * @param {string} projectDir
 * @param {string} [scope]
 */
export async function check(projectDir, scope) {
  const cfg = loadConfig(projectDir);
  const cmds = buildCmds(detectRunner(projectDir));

  if (scope === 'code') {
    if (!checkFileLines(projectDir, cfg.codeExt, cfg.codeMax, cfg.ignore, `Code (max ${cfg.codeMax} lines)`))
      process.exit(1);
    return;
  }
  if (scope === 'docs') {
    if (!checkFileLines(projectDir, cfg.docsExt, cfg.docsMax, cfg.ignore, `Docs (max ${cfg.docsMax} lines)`))
      process.exit(1);
    return;
  }

  const jsFiles = countFiles(projectDir, ['.js'], cfg.ignore);
  const cssFiles = countFiles(projectDir, ['.css'], cfg.ignore);
  const mdFiles = countFiles(projectDir, ['.md'], cfg.ignore);

  console.log('Running spec compliance check...\n');
  const results = [
    checkFileLines(projectDir, cfg.codeExt, cfg.codeMax, cfg.ignore, `Code (max ${cfg.codeMax} lines)`),
    checkFileLines(projectDir, cfg.docsExt, cfg.docsMax, cfg.ignore, `Docs (max ${cfg.docsMax} lines)`),
    checkImports(projectDir, cfg.ignore, 'Import map aliases (no ../ imports)'),
    runCmd('ESLint', cmds.lint, projectDir, `${jsFiles} files`),
    runCmd('Stylelint', cmds.stylelint, projectDir, `${cssFiles} files`),
    runCmd('Prettier', cmds.prettier, projectDir, `${jsFiles} files`),
    runCmd('Markdown', cmds.mdlint, projectDir, `${mdFiles} files`),
    runCmd('JSDoc types', cmds.types, projectDir, `${jsFiles} files`),
    runCmd('Security audit', cmds.audit, projectDir),
  ];

  const passed = results.filter(Boolean).length;
  console.log(`\n${'='.repeat(40)}`);
  console.log(`${passed}/${results.length} checks passed.`);
  if (passed < results.length) process.exit(1);
}
