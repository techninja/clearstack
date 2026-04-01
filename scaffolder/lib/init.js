/**
 * Project scaffolder — generates a spec-compliant project from templates.
 * @module lib/init
 */

import { input, select } from '@inquirer/prompts';
import { resolve } from 'node:path';
import { copyTemplates } from './copy.js';
import { writePackageJson } from './package-gen.js';

/**
 * Run the interactive init flow.
 * @param {string} pkgRoot - Root of the hybrids-spec package (where templates/ lives)
 */
export async function init(pkgRoot) {
  console.log('\n🏗️  hybrids-spec project scaffolder\n');

  const name = await input({ message: 'Project name:', default: 'my-app' });
  const description = await input({ message: 'Description:', default: 'A hybrids-spec project' });
  const mode = await select({
    message: 'Project mode:',
    choices: [
      { name: 'Full stack (Express + WebSocket + JSON DB + SSE)', value: 'fullstack' },
      { name: 'Static / browser only (localStorage, no server)', value: 'static' },
    ],
  });
  const port = mode === 'fullstack'
    ? await input({ message: 'Server port:', default: '3000' })
    : '3000';
  const dest = resolve(process.cwd(), name);
  const templateDir = resolve(pkgRoot, 'templates');

  console.log(`\nScaffolding ${name} (${mode}) → ${dest}\n`);

  const vars = { name, description, port, mode, year: new Date().getFullYear() };

  await copyTemplates(templateDir, 'shared', dest, vars);
  await copyTemplates(templateDir, mode, dest, vars);

  await writePackageJson(dest, vars);

  console.log(`\n✅ Project scaffolded at ${dest}`);
  console.log(`\n   cd ${name}`);
  console.log('   npm install');
  console.log(mode === 'fullstack' ? '   npm run dev\n' : '   npx serve public\n');
}
