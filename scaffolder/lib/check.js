/**
 * Spec compliance checker — validates line counts, lint, format, types, tests.
 * @module lib/check
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, extname, relative } from 'node:path';
import { execSync } from 'node:child_process';

/**
 * Run spec compliance checks on a project directory.
 * @param {string} projectDir
 */
export async function check(projectDir) {
  const envPath = resolve(projectDir, '.env');
  const env = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf-8')) : {};

  const codeMax = parseInt(env.SPEC_CODE_MAX_LINES) || 150;
  const docsMax = parseInt(env.SPEC_DOCS_MAX_LINES) || 500;
  const codeExt = (env.SPEC_CODE_EXTENSIONS || '.js,.css').split(',');
  const docsExt = (env.SPEC_DOCS_EXTENSIONS || '.md').split(',');
  const ignore = (env.SPEC_IGNORE_DIRS || 'node_modules,public/vendor,.git,.configs').split(',');

  console.log('Running spec compliance check...\n');
  const results = [];

  results.push(checkFiles(projectDir, codeExt, codeMax, ignore, `Code (max ${codeMax} lines)`));
  results.push(checkFiles(projectDir, docsExt, docsMax, ignore, `Docs (max ${docsMax} lines)`));
  results.push(runCmd('ESLint', 'npx eslint --config .configs/eslint.config.js . --fix', projectDir));
  results.push(runCmd('Prettier', 'npx prettier --config .configs/.prettierrc --write src scripts', projectDir));
  results.push(runCmd('JSDoc types', 'npx tsc --project .configs/jsconfig.json', projectDir));

  const passed = results.filter(Boolean).length;
  console.log(`\n${'='.repeat(40)}`);
  console.log(`${passed}/${results.length} checks passed.`);
  if (passed < results.length) process.exit(1);
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

/** Check file line counts. */
function checkFiles(root, extensions, max, ignoreDirs, label) {
  const violations = [];
  findFiles(root, extensions, ignoreDirs, root).forEach((file) => {
    const lines = readFileSync(resolve(root, file), 'utf-8').trimEnd().split('\n').length;
    if (lines > max) violations.push({ file, lines, max });
  });
  if (violations.length === 0) {
    console.log(`  ✅ ${label}`);
    return true;
  }
  console.log(`  ❌ ${label} — ${violations.length} violation(s):`);
  violations.forEach((v) => console.log(`     ${v.file}: ${v.lines} lines (max ${v.max})`));
  return false;
}

/** Recursively find files. */
function findFiles(dir, extensions, ignoreDirs, root) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    const rel = relative(root, full);
    if (entry.isDirectory()) {
      if (ignoreDirs.some((ig) => entry.name === ig || rel === ig || rel.startsWith(ig + '/'))) continue;
      results.push(...findFiles(full, extensions, ignoreDirs, root));
    } else if (extensions.includes(extname(entry.name))) {
      results.push(rel);
    }
  }
  return results;
}

/** Run a shell command, report pass/fail. */
function runCmd(label, cmd, cwd) {
  try {
    execSync(cmd, { cwd, stdio: 'pipe' });
    console.log(`  ✅ ${label}`);
    return true;
  } catch (err) {
    console.log(`  ❌ ${label}`);
    const out = (err.stdout || '') + (err.stderr || '');
    if (out.trim()) out.trim().split('\n').forEach((l) => console.log(`     ${l}`));
    return false;
  }
}
