/**
 * Spec config — environment detection, .env parsing, command building.
 * @module lib/spec-config
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** Detect the project's package manager runner (npx, pnpm exec, yarn). */
export function detectRunner(projectDir) {
  if (existsSync(resolve(projectDir, 'pnpm-lock.yaml'))) return 'pnpm exec';
  if (existsSync(resolve(projectDir, 'yarn.lock'))) return 'yarn';
  return 'npx';
}

/** @param {string} src @returns {Record<string, string>} */
function parseEnv(src) {
  /** @type {Record<string, string>} */
  const env = {};
  for (const line of src.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

/**
 * Load spec config from project .env, layering .env.local on top.
 * @param {string} projectDir
 */
export function loadConfig(projectDir) {
  const envPath = resolve(projectDir, '.env');
  const localPath = resolve(projectDir, '.env.local');
  const base = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf-8')) : {};
  const local = existsSync(localPath) ? parseEnv(readFileSync(localPath, 'utf-8')) : {};
  const env = { ...base, ...local };
  return {
    codeMax: parseInt(env.SPEC_CODE_MAX_LINES) || 150,
    testMax: parseInt(env.SPEC_TEST_MAX_LINES) || 300,
    docsMax: parseInt(env.SPEC_DOCS_MAX_LINES) || 500,
    codeExt: (env.SPEC_CODE_EXTENSIONS || '.js,.css').split(','),
    docsExt: (env.SPEC_DOCS_EXTENSIONS || '.md').split(','),
    testPattern: env.SPEC_TEST_PATTERN || '.test.js',
    ignore: (env.SPEC_IGNORE_DIRS || 'node_modules,src/vendor,.git,.configs').split(','),
  };
}

/** Build check commands for the detected package manager. */
export function buildCmds(projectDir) {
  const runner = detectRunner(projectDir);
  // pnpm 9.x audit hits a retired npm endpoint (410). Use --ignore-registry-errors
  // to avoid failing on registry issues outside the user's control.
  const audit = runner === 'pnpm exec'
    ? 'pnpm audit --prod --ignore-registry-errors'
    : 'npm audit --omit=dev';
  return {
    lint: `${runner} eslint --config .configs/eslint.config.js . --fix`,
    stylelint: `${runner} stylelint --config .configs/.stylelintrc.json "src/**/*.css" --fix`,
    prettier: `${runner} prettier --config .configs/.prettierrc --write src scripts`,
    mdlint: `${runner} markdownlint-cli2 --config .configs/.markdownlint.jsonc --fix "docs/**/*.md" "*.md"`,
    audit,
  };
}
