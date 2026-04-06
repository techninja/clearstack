#!/usr/bin/env node

/**
 * Spec enforcement CLI for the POC app.
 * Fast code quality checks only — no tests. Run `npm test` separately.
 * @module scripts/spec
 */

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, buildChecks, resolveChecks, parentKeys, CMDS } from '../lib/check.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const cfg = loadConfig(ROOT);
const checks = buildChecks(ROOT, cfg, CMDS);
const parents = parentKeys(checks);
const [sub, subsub] = process.argv.slice(2);

/** Run all spec quality checks. */
function runAll() {
  console.log('Running spec compliance check...\n');
  const results = checks.map((c) => c.run());
  const passed = results.filter(Boolean).length;
  console.log(`\n${'='.repeat(40)}`);
  console.log(`${passed}/${results.length} checks passed.`);
  if (passed < results.length) process.exit(1);
}

/** Build interactive menu choices with hierarchy. */
function menuChoices() {
  const choices = [];
  const seen = new Set();
  for (const c of checks) {
    if (c.parent && !seen.has(c.parent)) {
      seen.add(c.parent);
      const kids = checks.filter((k) => k.parent === c.parent);
      const label = kids.map((k) => k.name).join(' + ');
      choices.push({ name: `${label} [${c.parent}]`, value: c.parent });
      for (const k of kids)
        choices.push({ name: `  ${k.name} [${c.parent} ${k.key}]`, value: `${c.parent} ${k.key}` });
    } else if (!c.parent) {
      choices.push({ name: `${c.name} [${c.key}]`, value: c.key });
    }
  }
  choices.push({ name: 'All (full spec check)', value: 'all' });
  return choices;
}

/** Show interactive menu. */
async function interactive() {
  try {
    const { select } = await import('@inquirer/prompts');
    const action = await select({
      message: 'Spec checker — what do you want to validate?',
      choices: menuChoices(),
    });
    if (action === 'all') return runAll();
    const matched = resolveChecks(checks, action);
    if (!matched.every((c) => c.run())) process.exit(1);
  } catch (e) {
    if (e?.name === 'ExitPromptError') process.exit(0);
    throw e;
  }
}

const scope = subsub ? `${sub} ${subsub}` : sub;
if (scope === 'all') runAll();
else if (scope) {
  const matched = resolveChecks(checks, scope);
  if (!matched) {
    console.log(`Unknown check: ${scope}`);
    const tops = checks.filter((c) => !c.parent).map((c) => c.key);
    console.log(`Available: ${[...tops, ...parents].join(', ')}`);
    process.exit(1);
  }
  if (!matched.every((c) => c.run())) process.exit(1);
} else await interactive();
