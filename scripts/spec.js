#!/usr/bin/env node

/**
 * Spec enforcement CLI — one command to validate everything.
 * Usage:
 *   npm run spec          → interactive menu
 *   npm run spec:code     → check code file line counts
 *   npm run spec:docs     → check doc file line counts
 * @module scripts/spec
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { checkFiles, printResults } from './spec-check.js';
import { runCheck } from './spec-run.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
config({ path: resolve(ROOT, '.env') });

const CODE_MAX = parseInt(process.env.SPEC_CODE_MAX_LINES) || 150;
const DOCS_MAX = parseInt(process.env.SPEC_DOCS_MAX_LINES) || 500;
const CODE_EXT = (process.env.SPEC_CODE_EXTENSIONS || '.js,.css').split(',');
const DOCS_EXT = (process.env.SPEC_DOCS_EXTENSIONS || '.md').split(',');
const IGNORE = (process.env.SPEC_IGNORE_DIRS || 'node_modules,public/vendor,.git').split(',');

// Shared command strings — macOS needs find instead of shell globs
const CMD = {
  lint: 'npx eslint . --fix',
  format: 'npx prettier --write src scripts server.js server.test.js eslint.config.js',
  types: 'npx tsc --project jsconfig.json',
  testNode:
    'node --test $(find . -name "*.test.js" -not -path "./node_modules/*" -not -path "./public/*" -not -path "./src/components/*")',
  testBrowser: 'npx web-test-runner',
};

const sub = process.argv[2];

/** Check code file line counts. */
function runCode() {
  return printResults(`Code (max ${CODE_MAX} lines)`, checkFiles(ROOT, CODE_EXT, CODE_MAX, IGNORE));
}

/** Check doc file line counts. */
function runDocs() {
  return printResults(`Docs (max ${DOCS_MAX} lines)`, checkFiles(ROOT, DOCS_EXT, DOCS_MAX, IGNORE));
}

/** Run all spec checks — line counts, lint, format, types, tests. */
async function runAll() {
  console.log('Running full spec compliance check...\n');
  const r = [
    runCode(),
    runDocs(),
    runCheck('ESLint', CMD.lint, ROOT),
    runCheck('Prettier', CMD.format, ROOT),
    runCheck('JSDoc types (tsc)', CMD.types, ROOT),
    runCheck('Node tests', CMD.testNode, ROOT),
    runCheck('Browser tests', CMD.testBrowser, ROOT),
  ];
  const passed = r.filter(Boolean).length;
  console.log(`\n${'='.repeat(40)}`);
  console.log(`${passed}/${r.length} checks passed.`);
  if (passed < r.length) process.exit(1);
}

/** Show interactive menu. */
async function interactive() {
  const { select } = await import('@inquirer/prompts');
  const action = await select({
    message: 'Spec checker — what do you want to validate?',
    choices: [
      { name: `Code line counts (≤${CODE_MAX})`, value: 'code' },
      { name: `Doc line counts (≤${DOCS_MAX})`, value: 'docs' },
      { name: 'ESLint', value: 'lint' },
      { name: 'Prettier', value: 'format' },
      { name: 'JSDoc types (tsc --checkJs)', value: 'types' },
      { name: 'Node tests', value: 'test:node' },
      { name: 'Browser tests', value: 'test:browser' },
      { name: 'All (full spec compliance)', value: 'all' },
    ],
  });

  const checks = {
    code: () => runCode(),
    docs: () => runDocs(),
    lint: () => runCheck('ESLint', CMD.lint, ROOT),
    format: () => runCheck('Prettier', CMD.format, ROOT),
    types: () => runCheck('JSDoc types', CMD.types, ROOT),
    'test:node': () => runCheck('Node tests', CMD.testNode, ROOT),
    'test:browser': () => runCheck('Browser tests', CMD.testBrowser, ROOT),
  };

  if (action === 'all') return runAll();
  if (!checks[action]()) process.exit(1);
}

if (sub === 'code') {
  if (!runCode()) process.exit(1);
} else if (sub === 'docs') {
  if (!runDocs()) process.exit(1);
} else if (sub === 'all') await runAll();
else await interactive();
