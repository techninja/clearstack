#!/usr/bin/env node

/**
 * hybrids-spec CLI — scaffold, update, and check spec-compliant projects.
 * Usage:
 *   npx hybrids-spec init          → scaffold a new project
 *   npx hybrids-spec update        → sync spec docs from upstream
 *   npx hybrids-spec check         → run spec compliance checks
 *   npx hybrids-spec               → interactive menu
 */

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const cmd = process.argv[2];

/** Show interactive menu. */
async function interactive() {
  const { select } = await import('@inquirer/prompts');
  const action = await select({
    message: 'hybrids-spec — what do you want to do?',
    choices: [
      { name: 'Initialize a new project', value: 'init' },
      { name: 'Update spec docs from upstream', value: 'update' },
      { name: 'Run spec compliance check', value: 'check' },
    ],
  });
  await run(action);
}

/**
 * Run a subcommand.
 * @param {string} action
 */
async function run(action) {
  if (action === 'init') {
    const { init } = await import('../lib/init.js');
    await init(ROOT);
  } else if (action === 'update') {
    const { update } = await import('../lib/update.js');
    await update(ROOT);
  } else if (action === 'check') {
    const { check } = await import('../lib/check.js');
    await check(process.cwd());
  } else {
    console.log('Usage: hybrids-spec [init|update|check]');
  }
}

if (cmd) await run(cmd);
else await interactive();
