/**
 * Spec updater — syncs docs and configs from the clearstack package.
 * Docs are overwritten (clearstack-owned). Configs skip existing files
 * to preserve project customizations — use --force to overwrite.
 * @module lib/update
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { detectPlatforms, updatePlatform } from './platform.js';

/**
 * Sync a source directory to a destination.
 * @param {string} src
 * @param {string} dest
 * @param {string} label
 * @param {{ skipExisting?: boolean }} [opts]
 * @returns {number} count of updated files
 */
function syncDir(src, dest, label, opts = {}) {
  if (!existsSync(src)) return 0;
  mkdirSync(dest, { recursive: true });
  const files = readdirSync(src).filter((f) => !f.startsWith('.spec'));
  let updated = 0;

  for (const file of files) {
    const destPath = join(dest, file);
    if (opts.skipExisting && existsSync(destPath)) {
      console.log(`  ⏭ Skipped: ${label}/${file} (exists, use --force to overwrite)`);
      continue;
    }
    const srcContent = readFileSync(join(src, file), 'utf-8');
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
 * Update spec docs and configs from the clearstack package.
 * @param {string} pkgRoot - Root of the clearstack package
 * @param {{ force?: boolean }} [opts]
 */
export async function update(pkgRoot, opts = {}) {
  const templateShared = resolve(pkgRoot, 'templates/shared');
  let total = 0;

  console.log('');

  // Docs: always overwrite (clearstack-owned content)
  total += syncDir(
    resolve(templateShared, 'docs/clearstack'),
    resolve(process.cwd(), 'docs/clearstack'),
    'docs/clearstack',
  );

  // Configs: skip existing unless --force (project may have customized)
  total += syncDir(
    resolve(templateShared, '.configs'),
    resolve(process.cwd(), '.configs'),
    '.configs',
    { skipExisting: !opts.force },
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

  // Platform stacking: re-vendor + sync platform docs
  const platforms = detectPlatforms(process.cwd());
  for (const platform of platforms) {
    updatePlatform(platform, process.cwd());
    total++;
  }

  console.log(`\n  docs/app-spec/ — untouched (your project specs are safe)`);

  if (total === 0) {
    console.log('  ✅ All docs and configs are up to date.\n');
  } else {
    console.log(`\n  ${total} file(s) updated. Review with: git diff docs/ .configs/\n`);
  }
}
