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
    serverCmd: env.SPEC_SERVER_CMD || null,
    rawEnv: env,
    codeMax: parseInt(env.SPEC_CODE_MAX_LINES) || 150,
    testMax: parseInt(env.SPEC_TEST_MAX_LINES) || 300,
    docsMax: parseInt(env.SPEC_DOCS_MAX_LINES) || 500,
    codeExt: (env.SPEC_CODE_EXTENSIONS || '.js,.css').split(','),
    docsExt: (env.SPEC_DOCS_EXTENSIONS || '.md').split(','),
    testPattern: env.SPEC_TEST_PATTERN || '.test.js',
    ignore: (env.SPEC_IGNORE_DIRS || 'node_modules,src/vendor,.git,.configs').split(','),
    watchDirs: env.SPEC_WATCH_DIRS ? env.SPEC_WATCH_DIRS.split(',').map((d) => d.trim()) : null,
  };
}

/**
 * Default ext→check-key mapping for built-ins.
 * Extensions override this by declaring a `watchExts` array on their check object.
 * @type {Record<string, string[]>}
 */
const EXT_DEFAULTS = {
  '.js':  ['lines', 'es', 'prettier', 'frontend', 'imports', 'i18n'],
  '.mjs': ['lines', 'es', 'frontend', 'imports'],
  '.css': ['lines', 'css'],
  '.md':  ['docs', 'md'],
  '.json': ['i18n'],
  '.php': [],
};

/** Checks that run on pure file reads — no subprocess, sub-millisecond. */
export const FAST_CHECKS = new Set(['lines', 'docs', 'imports', 'i18n', 'tests']);

/**
 * Build ext→keys map, merging EXT_DEFAULTS with `watchExts` declared on extension checks.
 * @param {object[]} checks
 * @returns {(ext: string) => string[]}
 */
export function makeExtMap(checks) {
  const map = new Map(Object.entries(EXT_DEFAULTS).map(([k, v]) => [k, new Set(v)]));
  for (const c of checks) {
    if (!c.watchExts) continue;
    for (const ext of c.watchExts) {
      if (!map.has(ext)) map.set(ext, new Set());
      map.get(ext).add(c.key);
    }
  }
  return (ext) => [...(map.get(ext) ?? [])];
}

/**
 * @param {string} projectDir
 * @param {{ watch?: boolean }} [opts]
 */
export function buildCmds(projectDir, opts) {
  const runner = detectRunner(projectDir);
  const audit = runner === 'pnpm exec'
    ? 'pnpm audit --prod --ignore-registry-errors'
    : 'npm audit --omit=dev';
  if (opts?.watch) return {
    lint: `${runner} eslint --config .configs/eslint.config.js .`,
    stylelint: `${runner} stylelint --config .configs/.stylelintrc.json "src/**/*.css"`,
    prettier: `${runner} prettier --config .configs/.prettierrc --check src scripts`,
    mdlint: `${runner} markdownlint-cli2 --config .configs/.markdownlint.jsonc "docs/**/*.md" "*.md"`,
    audit,
    fix: {
      es: `${runner} eslint --config .configs/eslint.config.js . --fix`,
      css: `${runner} stylelint --config .configs/.stylelintrc.json "src/**/*.css" --fix`,
      prettier: `${runner} prettier --config .configs/.prettierrc --write src scripts`,
      md: `${runner} markdownlint-cli2 --config .configs/.markdownlint.jsonc --fix "docs/**/*.md" "*.md"`,
    },
  };
  return {
    lint: `${runner} eslint --config .configs/eslint.config.js . --fix`,
    stylelint: `${runner} stylelint --config .configs/.stylelintrc.json "src/**/*.css" --fix`,
    prettier: `${runner} prettier --config .configs/.prettierrc --write src scripts`,
    mdlint: `${runner} markdownlint-cli2 --config .configs/.markdownlint.jsonc --fix "docs/**/*.md" "*.md"`,
    audit,
  };
}
