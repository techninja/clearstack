#!/usr/bin/env node

/**
 * clearstack CLI — scaffold, update, and check spec-compliant projects.
 * Usage:
 *   clearstack init [-y] [--static|--fullstack] [--port 3000]
 *   clearstack update [--force]
 *   clearstack build [og|og-images|all] → generate OG pages and/or images
 *   clearstack check [code|docs|imports|lint|format|types|audit|all]
 *   clearstack report --json      → structured JSON output for tooling
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
        { name: 'Entropy report (drift summary)', value: 'report' },
        { name: 'Build OG pages + images', value: 'build' },
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
    await update(PKG_ROOT, { force: !!flags.force });
  } else if (action === 'check') {
    const subs = args.filter((a) => a !== cmd && !a.startsWith('-'));
    const { check } = await import('../lib/check.js');
    await check(process.cwd(), subs.join(' ') || undefined);
  } else if (action === 'report') {
    const { report } = await import('../lib/report.js');
    report(process.cwd(), { json: !!flags.json });
  } else if (action === 'build') {
    const sub = args.find((a) => a !== 'build' && !a.startsWith('-'));
    if (sub === 'sitemap') {
      const { buildSitemap } = await import('../lib/build-sitemap.js');
      buildSitemap({ projectDir: process.cwd(), outDir: flags.out || 'dist', baseUrl: flags.url || '' });
    } else if (sub === 'modulepreload' || sub === 'preload') {
      const { buildModulePreload } = await import('../lib/build-modulepreload.js');
      buildModulePreload({ projectDir: process.cwd(), outDir: flags.out || 'dist' });
    } else if (sub === 'og-images' || sub === 'images') {
      const mod = await import('../lib/build-og-images.js');
      const common = { projectDir: process.cwd(), outDir: flags.out || 'dist', logo: flags.logo || '', siteName: flags.site || '' };
      if (flags.slug) await mod.buildOneOGImage({ ...common, slug: flags.slug });
      else await mod.buildOGImages(common);
    } else {
      const { buildOG } = await import('../lib/build-og.js');
      buildOG({
        projectDir: process.cwd(),
        outDir: flags.out || 'dist',
        baseUrl: flags.url || '',
      });
      const { buildSitemap } = await import('../lib/build-sitemap.js');
      buildSitemap({ projectDir: process.cwd(), outDir: flags.out || 'dist', baseUrl: flags.url || '' });
      if (sub === 'all') {
        const { buildModulePreload } = await import('../lib/build-modulepreload.js');
        buildModulePreload({ projectDir: process.cwd(), outDir: flags.out || 'dist' });
        const { buildOGImages } = await import('../lib/build-og-images.js');
        await buildOGImages({
          projectDir: process.cwd(),
          outDir: flags.out || 'dist',
          logo: flags.logo || '',
          siteName: flags.site || '',
        });
      }
    }
  } else {
    console.log('Usage: clearstack [init|update|check|build] [-y]');
  }
}

if (cmd) await run(cmd);
else if (yes) await run('check');
else await interactive();
