/**
 * Spec doc updater — syncs docs from the upstream package to the local project.
 * Copies new versions so the user can review the git diff.
 * @module lib/update
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const SPEC_VERSION_FILE = '.specversion';

/**
 * Update spec docs from the package templates to the local project.
 * @param {string} pkgRoot - Root of the hybrids-spec package
 */
export async function update(pkgRoot) {
  const docsSource = resolve(pkgRoot, 'templates/shared/docs');
  const docsDest = resolve(process.cwd(), 'docs');

  if (!existsSync(docsSource)) {
    console.error('No upstream docs found in package.');
    return;
  }

  mkdirSync(docsDest, { recursive: true });

  const files = readdirSync(docsSource).filter((f) => f.endsWith('.md'));
  let updated = 0;

  console.log('  (skipping docs/project/ — your project-specific specs are safe)\n');

  for (const file of files) {
    const srcContent = readFileSync(join(docsSource, file), 'utf-8');
    const destPath = join(docsDest, file);
    const destContent = existsSync(destPath) ? readFileSync(destPath, 'utf-8') : '';

    if (srcContent !== destContent) {
      writeFileSync(destPath, srcContent);
      console.log(`  ✓ Updated: docs/${file}`);
      updated++;
    }
  }

  // Write spec version marker
  const pkg = JSON.parse(readFileSync(resolve(pkgRoot, 'package.json'), 'utf-8'));
  writeFileSync(resolve(docsDest, SPEC_VERSION_FILE), pkg.version + '\n');

  if (updated === 0) {
    console.log('  ✅ All docs are up to date.');
  } else {
    console.log(`\n  ${updated} doc(s) updated. Review changes with: git diff docs/`);
  }
}
