#!/usr/bin/env node

/**
 * Spec enforcement CLI for the POC app.
 * Imports shared check logic from lib/check.js and adds test runners.
 * @module scripts/spec
 */

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, checkFileLines, runCmd, countFiles, CMDS } from '../lib/check.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const cfg = loadConfig(ROOT);
const sub = process.argv[2];

const POC_CMDS = {
  testNode: 'node --test tests/*.test.js src/utils/*.test.js src/store/*.test.js',
  testBrowser: 'npx web-test-runner --config .configs/web-test-runner.config.js',
};

/** Run all spec checks — shared checks + POC test runners. */
async function runAll() {
  const jsFiles = countFiles(ROOT, ['.js'], cfg.ignore);
  const cssFiles = countFiles(ROOT, ['.css'], cfg.ignore);
  const mdFiles = countFiles(ROOT, ['.md'], cfg.ignore);
  const testFiles = countFiles(ROOT, ['.js'], cfg.ignore, ['tests', 'src'], /\.test\.js$/);
  const browserTests = countFiles(ROOT, ['.js'], cfg.ignore, ['src/components'], /\.test\.js$/);

  console.log('Running full spec compliance check...\n');
  const r = [
    checkFileLines(ROOT, cfg.codeExt, cfg.codeMax, cfg.ignore, `Code (max ${cfg.codeMax} lines)`),
    checkFileLines(ROOT, cfg.docsExt, cfg.docsMax, cfg.ignore, `Docs (max ${cfg.docsMax} lines)`),
    runCmd('ESLint', CMDS.lint, ROOT, `${jsFiles} files`),
    runCmd('Stylelint', CMDS.stylelint, ROOT, `${cssFiles} files`),
    runCmd(
      'Prettier',
      CMDS.prettier +
        ' templates/**/*.md templates/**/*.html templates/**/*.css templates/**/*.json',
      ROOT,
      `${jsFiles} files`,
    ),
    runCmd('Markdown', CMDS.mdlint, ROOT, `${mdFiles} files`),
    runCmd('JSDoc types', CMDS.types, ROOT, `${jsFiles} files`),
    runCmd('Node tests', POC_CMDS.testNode, ROOT, `${testFiles} test files`),
    runCmd('Browser tests', POC_CMDS.testBrowser, ROOT, `${browserTests} test files`),
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
      { name: `Code line counts (≤${cfg.codeMax})`, value: 'code' },
      { name: `Doc line counts (≤${cfg.docsMax})`, value: 'docs' },
      { name: 'ESLint', value: 'lint' },
      { name: 'Stylelint', value: 'stylelint' },
      { name: 'Prettier', value: 'format' },
      { name: 'Markdown lint', value: 'mdlint' },
      { name: 'JSDoc types (tsc --checkJs)', value: 'types' },
      { name: 'Node tests', value: 'test:node' },
      { name: 'Browser tests', value: 'test:browser' },
      { name: 'All (full spec compliance)', value: 'all' },
    ],
  });

  const checks = {
    code: () =>
      checkFileLines(ROOT, cfg.codeExt, cfg.codeMax, cfg.ignore, `Code (max ${cfg.codeMax} lines)`),
    docs: () =>
      checkFileLines(ROOT, cfg.docsExt, cfg.docsMax, cfg.ignore, `Docs (max ${cfg.docsMax} lines)`),
    lint: () => runCmd('ESLint', CMDS.lint, ROOT),
    stylelint: () => runCmd('Stylelint', CMDS.stylelint, ROOT),
    format: () => runCmd('Prettier', CMDS.prettier, ROOT),
    mdlint: () => runCmd('Markdown', CMDS.mdlint, ROOT),
    types: () => runCmd('JSDoc types', CMDS.types, ROOT),
    'test:node': () => runCmd('Node tests', POC_CMDS.testNode, ROOT),
    'test:browser': () => runCmd('Browser tests', POC_CMDS.testBrowser, ROOT),
  };

  if (action === 'all') return runAll();
  if (!checks[action]()) process.exit(1);
}

if (sub === 'code') {
  if (
    !checkFileLines(ROOT, cfg.codeExt, cfg.codeMax, cfg.ignore, `Code (max ${cfg.codeMax} lines)`)
  )
    process.exit(1);
} else if (sub === 'docs') {
  if (
    !checkFileLines(ROOT, cfg.docsExt, cfg.docsMax, cfg.ignore, `Docs (max ${cfg.docsMax} lines)`)
  )
    process.exit(1);
} else if (sub === 'all') await runAll();
else await interactive();
