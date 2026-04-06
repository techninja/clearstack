#!/usr/bin/env node

/**
 * Spec enforcement CLI for the POC app.
 * Fast code quality checks only — no tests. Run `npm test` separately.
 * @module scripts/spec
 */

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadConfig,
  checkFileLines,
  checkImports,
  runCmd,
  countFiles,
  CMDS,
} from '../lib/check.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const cfg = loadConfig(ROOT);
const sub = process.argv[2];

/** Run all spec quality checks. */
async function runAll() {
  const jsFiles = countFiles(ROOT, ['.js'], cfg.ignore);
  const cssFiles = countFiles(ROOT, ['.css'], cfg.ignore);
  const mdFiles = countFiles(ROOT, ['.md'], cfg.ignore);

  console.log('Running spec compliance check...\n');
  const r = [
    checkFileLines(ROOT, cfg.codeExt, cfg.codeMax, cfg.ignore, `Code (max ${cfg.codeMax} lines)`),
    checkFileLines(ROOT, cfg.docsExt, cfg.docsMax, cfg.ignore, `Docs (max ${cfg.docsMax} lines)`),
    checkImports(ROOT, cfg.ignore, 'Import map aliases (no ../ imports)'),
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
    runCmd('Security audit', CMDS.audit, ROOT),
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
      { name: 'Import map aliases (no ../ imports)', value: 'imports' },
      { name: 'ESLint', value: 'lint' },
      { name: 'Stylelint', value: 'stylelint' },
      { name: 'Prettier', value: 'format' },
      { name: 'Markdown lint', value: 'mdlint' },
      { name: 'JSDoc types (tsc --checkJs)', value: 'types' },
      { name: 'Security audit', value: 'audit' },
      { name: 'All (full spec check)', value: 'all' },
    ],
  });

  const checks = {
    code: () =>
      checkFileLines(ROOT, cfg.codeExt, cfg.codeMax, cfg.ignore, `Code (max ${cfg.codeMax} lines)`),
    docs: () =>
      checkFileLines(ROOT, cfg.docsExt, cfg.docsMax, cfg.ignore, `Docs (max ${cfg.docsMax} lines)`),
    imports: () => checkImports(ROOT, cfg.ignore, 'Import map aliases (no ../ imports)'),
    lint: () => runCmd('ESLint', CMDS.lint, ROOT),
    stylelint: () => runCmd('Stylelint', CMDS.stylelint, ROOT),
    format: () => runCmd('Prettier', CMDS.prettier, ROOT),
    mdlint: () => runCmd('Markdown', CMDS.mdlint, ROOT),
    types: () => runCmd('JSDoc types', CMDS.types, ROOT),
    audit: () => runCmd('Security audit', CMDS.audit, ROOT),
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
