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
    ...(isFullstack ? {
      start: 'node src/server.js',
      dev: 'node --watch --env-file=.env src/server.js',
    } : {}),
    postinstall: 'node scripts/vendor-deps.js && node scripts/build-icons.js',
    test: 'npm run test:node && npm run test:browser',
    'test:node': 'node --test tests/*.test.js src/utils/*.test.js src/store/*.test.js',
    'test:browser': 'web-test-runner --config .configs/web-test-runner.config.js',
    spec: 'clearstack check',
    'spec:code': 'clearstack check code',
    'spec:docs': 'clearstack check docs',
    'spec:update': 'clearstack update',
    lint: 'eslint --config .configs/eslint.config.js .',
    'lint:fix': 'eslint --config .configs/eslint.config.js . --fix',
    format: 'prettier --config .configs/.prettierrc --write src scripts tests',
    typecheck: 'tsc --project .configs/jsconfig.json',
  };

  const specDeps = {
    hybrids: '^9.1.22',
    'lucide-static': '^1.7.0',
    ...(isFullstack ? { express: '^5.2.1', ws: '^8.0.0' } : {}),
  };

  const specDevDeps = {
    '@techninja/clearstack': '^0.2.0',
    '@open-wc/testing': '^4.0.0',
    '@web/test-runner': '^0.20.0',
    '@web/test-runner-playwright': '^0.11.0',
    eslint: '^10.1.0',
    'eslint-config-prettier': '^10.1.8',
    'eslint-plugin-jsdoc': '^62.8.1',
    playwright: '^1.50.0',
    prettier: '^3.8.1',
    typescript: '^6.0.2',
  };

  const pkg = existing
    ? {
        ...existing,
        name: vars.name,
        description: vars.description,
        type: 'module',
        ...(isFullstack ? { main: 'src/server.js' } : {}),
        scripts: { ...existing.scripts, ...specScripts },
        dependencies: { ...existing.dependencies, ...specDeps },
        devDependencies: { ...existing.devDependencies, ...specDevDeps },
      }
    : {
        name: vars.name,
        version: '0.1.0',
        type: 'module',
        description: vars.description,
        ...(isFullstack ? { main: 'src/server.js' } : {}),
        scripts: specScripts,
        keywords: ['hybrids', 'web-components', 'no-build'],
        license: 'MIT',
        dependencies: specDeps,
        devDependencies: specDevDeps,
      };

  writeFileSync(resolve(dest, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
  console.log('  ✓ package.json' + (existing ? ' (merged)' : ''));
}
