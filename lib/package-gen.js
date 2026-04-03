/**
 * Generates package.json for the scaffolded project.
 * @module lib/package-gen
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Write a package.json tailored to the project mode.
 * Merges with existing package.json if provided.
 * @param {string} dest - Project directory
 * @param {{ name: string, description: string, port: string, mode: string }} vars
 * @param {Record<string, unknown>} [existing] - Existing package.json to merge with
 */
export async function writePackageJson(dest, vars, existing) {
  const isFullstack = vars.mode === 'fullstack';

  const specScripts = {
    start: 'node src/server.js',
    dev: 'node --watch --env-file=.env --env-file=.env.local src/server.js',
    postinstall: 'node scripts/setup.js',
    test: 'node scripts/test.js',
    spec: 'clearstack',
  };

  const specDeps = {
    express: '^5.2.1',
    hybrids: '^9.1.22',
    'lucide-static': '^1.7.0',
    ...(isFullstack ? { ws: '^8.0.0' } : {}),
  };

  const specDevDeps = {
    '@techninja/clearstack': '^0.2.0',
    '@types/node': '^22.0.0',
    '@open-wc/testing': '^4.0.0',
    '@web/test-runner': '^0.20.0',
    '@web/test-runner-playwright': '^0.11.0',
    eslint: '^10.1.0',
    'eslint-config-prettier': '^10.1.8',
    'eslint-plugin-jsdoc': '^62.8.1',
    'eslint-plugin-unused-imports': '^4.0.0',
    'markdownlint-cli2': '^0.22.0',
    playwright: '^1.50.0',
    prettier: '^3.8.1',
    stylelint: '^17.6.0',
    'stylelint-config-standard': '^40.0.0',
    typescript: '^6.0.2',
  };

  const pkg = existing
    ? {
        ...existing,
        name: vars.name,
        description: vars.description,
        type: 'module',
        main: 'src/server.js',
        scripts: { ...existing.scripts, ...specScripts },
        dependencies: { ...existing.dependencies, ...specDeps },
        devDependencies: { ...existing.devDependencies, ...specDevDeps },
      }
    : {
        name: vars.name,
        version: '0.1.0',
        type: 'module',
        description: vars.description,
        main: 'src/server.js',
        scripts: specScripts,
        keywords: ['hybrids', 'web-components', 'no-build'],
        license: 'MIT',
        dependencies: specDeps,
        devDependencies: specDevDeps,
      };

  writeFileSync(resolve(dest, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
  console.log('  ✓ package.json' + (existing ? ' (merged)' : ''));
}
