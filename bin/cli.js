#!/usr/bin/env node

/**
 * clearstack CLI — scaffold, update, and check spec-compliant projects.
 * Usage:
 *   clearstack init [-y] [--static|--fullstack] [--port 3000]
 *   clearstack update
 *   clearstack check [code|docs|imports|lint|lint es|format|types|audit|all]
 *   clearstack                   → interactive menu
 */

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const cmd = args.find((a) => !a.startsWith('-'));
const flags = Object.fromEntries(
  args.filter((a) => a.startsWith('--')).map((a) => {
    const [k, v] = a.slice(2).split('=');
    return [k, v ?? true];
  }),
);
const yes = args.includes('-y') || args.includes('--yes');
if (flags.static) flags.mode = 'static';
if (flags.fullstack) flags.mode = 'fullstack';

/** Show interactive menu. */
async function interactive() {
  try {
    const { select } = await import('@inquirer/prompts');
    const action = await select({
      message: 'clearstack — what do you want to do?',
      choices: [
        { name: 'Initialize a new project', value: 'init' },
        { name: 'Update spec docs + configs', value: 'update' },
        { name: 'Run spec compliance check', value: 'check' },
      ],
    });
    await run(action);
  } catch (e) {
    if (e?.name === 'ExitPromptError') process.exit(0);
    throw e;
  }
}

/**
 * Run a subcommand.
 * @param {string} action
 */
async function run(action) {
  if (action === 'init') {
    const { init } = await import('../lib/init.js');
    await init(PKG_ROOT, { yes, ...flags });
  } else if (action === 'update') {
    const { update } = await import('../lib/update.js');
    await update(PKG_ROOT);
  } else if (action === 'check') {
    const subs = args.filter((a) => a !== cmd && !a.startsWith('-'));
    const { check } = await import('../lib/check.js');
    await check(process.cwd(), subs.join(' ') || undefined);
  } else {
    console.log('Usage: clearstack [init|update|check] [-y]');
  }
}

if (cmd) await run(cmd);
else if (yes) await run('check');
else await interactive();
