/**
 * Entropy report — runs the full spec pipeline, collects structured results.
 * Uses the same check functions as `spec all` but in quiet mode for data.
 * @module lib/report
 */

import { runCmd, checkFileLines, checkImports } from './spec-utils.js';
import { loadConfig, buildCmds, detectRunner } from './spec-config.js';

/**
 * Run full spec pipeline and return structured JSON results.
 * @param {string} dir
 * @returns {{ checks: object[], summary: object }}
 */
export function collect(dir) {
  const cfg = loadConfig(dir);
  const cmds = buildCmds(dir);
  const runner = detectRunner(dir);
  const q = { quiet: true };

  // Phase 1: lint/format fixes (mutating, like spec all)
  const lint = runCmd('ESLint', cmds.lint, dir, undefined, q);
  const stylelint = runCmd('Stylelint', cmds.stylelint, dir, undefined, q);
  const prettier = runCmd('Prettier', cmds.prettier, dir, undefined, q);
  const mdlint = runCmd('Markdown', cmds.mdlint, dir, undefined, q);

  // Phase 2: measure post-fix state
  const code = checkFileLines(dir, cfg.codeExt, cfg.codeMax, cfg.ignore, 'Code', { exclude: cfg.testPattern, quiet: true });
  const tests = checkFileLines(dir, cfg.codeExt, cfg.testMax, cfg.ignore, 'Tests', { include: cfg.testPattern, quiet: true });
  const docs = checkFileLines(dir, cfg.docsExt, cfg.docsMax, cfg.ignore, 'Docs', { quiet: true });
  const imports = checkImports(dir, cfg.ignore, 'Imports', q);

  // Phase 3: types
  const types = runCmd('Types', `${runner} tsc --project .configs/jsconfig.json`, dir, undefined, q);

  // Phase 4: audit
  const audit = runCmd('Audit', cmds.audit, dir, undefined, q);

  const checks = [lint, stylelint, mdlint, prettier, code, tests, docs, imports, types, audit];
  const allLineViolations = [...(code.violations || []), ...(tests.violations || []), ...(docs.violations || [])];
  const totalFiles = (code.files || 0) + (tests.files || 0) + (docs.files || 0);
  const excessLines = allLineViolations.reduce((s, v) => s + (v.lines - v.max), 0);

  return {
    checks,
    summary: {
      totalFiles,
      totalChecks: checks.length,
      passed: checks.filter((c) => c.pass).length,
      fileViolations: allLineViolations.length,
      importViolations: imports.violations?.length || 0,
      excessLines,
      lintErrors: (lint.errors?.length || 0) + (stylelint.errors?.length || 0),
      typeErrors: types.errors?.length || 0,
    },
  };
}

/**
 * Run report and print human-friendly output (or JSON with --json flag).
 * @param {string} projectDir
 * @param {{ json?: boolean }} [opts]
 */
export function report(projectDir, opts = {}) {
  console.log('\n🔧 Running full spec pipeline...\n');
  const { checks, summary } = collect(projectDir);

  if (opts.json) {
    console.log(JSON.stringify({ checks, summary }, null, 2));
    return;
  }

  const pct = summary.totalFiles > 0
    ? ((summary.totalFiles - summary.fileViolations) / summary.totalFiles * 100).toFixed(1)
    : '100.0';

  console.log('📊 Clearstack Entropy Report\n');
  console.log(`   Checks:       ${summary.passed}/${summary.totalChecks} passed`);
  console.log(`   Project size: ${summary.totalFiles} files`);
  console.log(`   Compliance:   ${pct}% of files within line limits\n`);

  for (const c of checks) {
    const icon = c.pass ? '✅' : '❌';
    console.log(`   ${icon} ${c.label} (${c.time})`);
  }

  if (summary.excessLines > 0) {
    const violations = [...(checks[4].violations || []), ...(checks[5].violations || []), ...(checks[6].violations || [])];
    violations.sort((a, b) => (b.lines - b.max) - (a.lines - a.max));
    console.log(`\n   Total excess: ${summary.excessLines} lines over limits across ${summary.fileViolations} file(s)`);
    console.log('   Top offenders:');
    for (const v of violations.slice(0, 5)) console.log(`     ${v.file}: ${v.lines} lines (+${v.lines - v.max})`);
    const unowned = violations.filter((v) => /\b(vendor|dist|build)\b/.test(v.file));
    if (unowned.length) console.log(`\n   💡 ${unowned.length} in vendor/dist — consider adding to SPEC_IGNORE_DIRS`);
  }

  if (summary.lintErrors > 0) console.log(`\n   ⚠️  ${summary.lintErrors} unfixable lint error(s) remain`);
  if (summary.typeErrors > 0) console.log(`   ⚠️  ${summary.typeErrors} type error(s)`);
  if (summary.importViolations > 0) console.log(`   ⚠️  ${summary.importViolations} parent (../) import(s) need aliases`);

  if (summary.passed === summary.totalChecks) {
    console.log('\n   ✨ All clear — zero entropy drift.\n');
  } else {
    console.log('');
  }
}
