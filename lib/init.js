/**
 * Project scaffolder — generates a spec-compliant project from templates.
 * @module lib/init
 */

import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { copyTemplates } from './copy.js';
import { writePackageJson } from './package-gen.js';
import { detectPlatforms, initPlatform } from './platform.js';

/**
 * @typedef {Object} InitOptions
 * @property {boolean} [yes] - Skip prompts, use defaults
 * @property {string} [mode] - 'fullstack' or 'static'
 * @property {string} [port] - Server port
 */

/**
 * Run the init flow.
 * @param {string} pkgRoot - Root of the clearstack package
 * @param {InitOptions} [opts]
 */
export async function init(pkgRoot, opts = {}) {
  console.log('\n🏗️  Clearstack project scaffolder\n');

  const dest = process.cwd();
  const pkgPath = resolve(dest, 'package.json');
  const existingPkg = existsSync(pkgPath)
    ? JSON.parse(readFileSync(pkgPath, 'utf-8'))
    : null;

  let name, description, mode, port;

  if (opts.yes) {
    name = existingPkg?.name || basename(dest);
    description = existingPkg?.description || 'A Clearstack project';
    mode = opts.mode || 'fullstack';
    port = opts.port || '3000';
  } else {
    const { input, select } = await import('@inquirer/prompts');
    name = await input({
      message: 'Project name:',
      default: existingPkg?.name || basename(dest),
    });
    description = await input({
      message: 'Description:',
      default: existingPkg?.description || 'A Clearstack project',
    });
    mode = await select({
      message: 'Project mode:',
      choices: [
        { name: 'Full stack (Express + WebSocket + JSON DB + SSE)', value: 'fullstack' },
        { name: 'Static / browser only (localStorage, no server)', value: 'static' },
      ],
    });
    port = mode === 'fullstack'
      ? await input({ message: 'Server port:', default: '3000' })
      : '3000';
  }

  const templateDir = resolve(pkgRoot, 'templates');
  const vars = { name, description, port, mode, year: new Date().getFullYear() };

  console.log(`Scaffolding ${name} (${mode}) → ${dest}\n`);

  await copyTemplates(templateDir, 'shared', dest, vars);
  await copyTemplates(templateDir, mode, dest, vars);
  await writePackageJson(dest, vars, existingPkg);

  // Copy .env → .env.local for immediate editing
  const envPath = resolve(dest, '.env');
  const localPath = resolve(dest, '.env.local');
  if (existsSync(envPath) && !existsSync(localPath)) {
    copyFileSync(envPath, localPath);
    console.log('  ✓ .env.local (edit this, .env has defaults)');
  }

  // Platform stacking: detect and scaffold platform layers
  const platforms = detectPlatforms(dest);
  for (const platform of platforms) initPlatform(platform, dest);

  console.log(`\n✅ Project scaffolded at ${dest}`);
  console.log('   npm install');
  console.log('   npm run dev\n');
}
