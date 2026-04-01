/**
 * Spec updater — syncs docs and configs from the clearstack package.
 * Copies new versions so the user can review the git diff.
 * @module lib/update
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

/**
 * Sync a source directory to a destination, comparing file contents.
 * @param {string} src
 * @param {string} dest
 * @param {string} label
 * @returns {number} count of updated files
 */
function syncDir(src, dest, label) {
  if (!existsSync(src)) return 0;
  mkdirSync(dest, { recursive: true });

  const files = readdirSync(src).filter((f) => !f.startsWith('.spec'));
  let updated = 0;

  for (const file of files) {
    const srcContent = readFileSync(join(src, file), 'utf-8');
    const destPath = join(dest, file);
    const destContent = existsSync(destPath) ? readFileSync(destPath, 'utf-8') : '';

    if (srcContent !== destContent) {
      writeFileSync(destPath, srcContent);
      console.log(`  ✓ Updated: ${label}/${file}`);
      updated++;
    }
  }
  return updated;
}

/**
 * Update spec docs and configs from the clearstack package to the local project.
 * @param {string} pkgRoot - Root of the clearstack package
 */
export async function update(pkgRoot) {
  const templateShared = resolve(pkgRoot, 'templates/shared');
  let total = 0;

  console.log('');

  total += syncDir(
    resolve(templateShared, 'docs/clearstack'),
    resolve(process.cwd(), 'docs/clearstack'),
    'docs/clearstack',
  );

  total += syncDir(
    resolve(templateShared, '.configs'),
    resolve(process.cwd(), '.configs'),
    '.configs',
  );

  // Merge .gitignore (append missing lines, never remove user entries)
  const gitignoreSrc = resolve(templateShared, 'gitignore');
  if (existsSync(gitignoreSrc)) {
    const destPath = resolve(process.cwd(), '.gitignore');
    const srcLines = readFileSync(gitignoreSrc, 'utf-8').split('\n').filter((l) => l.trim());
    const existing = existsSync(destPath) ? readFileSync(destPath, 'utf-8') : '';
    const existingSet = new Set(existing.split('\n').map((l) => l.trim()));
    const toAdd = srcLines.filter((l) => !existingSet.has(l.trim()));
    if (toAdd.length > 0) {
      const sep = existing.endsWith('\n') ? '' : '\n';
      writeFileSync(destPath, existing + sep + toAdd.join('\n') + '\n');
      console.log(`  ✓ Merged: .gitignore (+${toAdd.length} entries)`);
      total++;
    }
  }

  // Write spec version marker
  const pkg = JSON.parse(readFileSync(resolve(pkgRoot, 'package.json'), 'utf-8'));
  const versionPath = resolve(process.cwd(), 'docs/clearstack/.specversion');
  mkdirSync(resolve(process.cwd(), 'docs/clearstack'), { recursive: true });
  writeFileSync(versionPath, pkg.version + '\n');

  console.log(`\n  docs/app-spec/ — untouched (your project specs are safe)`);

  if (total === 0) {
    console.log('  ✅ All docs and configs are up to date.\n');
  } else {
    console.log(`\n  ${total} file(s) updated. Review with: git diff docs/ .configs/\n`);
  }
}
