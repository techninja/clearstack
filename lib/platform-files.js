/**
 * Platform file operations — vendor, sync, init, update.
 * Detection lives in platform.js.
 * @module lib/platform-files
 */

import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

/**
 * Copy src → dest recursively (always overwrite).
 * @param {string} src
 * @param {string} dest
 * @param {string} label
 */
function copyDir(src, dest, label) {
  if (!existsSync(src)) return 0;
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log(`  ✓ Synced: ${label}`);
  return 1;
}

/**
 * Copy entries from src → dest, skipping files that already exist.
 * Directories in `skipDirs` are excluded entirely.
 * @param {string} src
 * @param {string} dest
 * @param {string} label
 * @param {Set<string>} [skipDirs]
 */
function copySkipExisting(src, dest, label, skipDirs) {
  if (!existsSync(src)) return 0;
  mkdirSync(dest, { recursive: true });
  let count = 0;
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      if (skipDirs?.has(entry.name)) {
        console.log(`  ⏭ Skipped: ${label}/${entry.name}/ (resolved from package)`);
        continue;
      }
      count += copySkipExisting(srcPath, destPath, `${label}/${entry.name}`, skipDirs);
    } else if (existsSync(destPath)) {
      console.log(`  ⏭ Skipped: ${label}/${entry.name} (exists)`);
    } else {
      cpSync(srcPath, destPath);
      console.log(`  ✓ Created: ${label}/${entry.name}`);
      count++;
    }
  }
  return count;
}

/**
 * Copy src → dest recursively, overwriting files but merging directories.
 * @param {string} src
 * @param {string} dest
 * @param {string} label
 */
function copyMerge(src, dest, label) {
  if (!existsSync(src)) return 0;
  mkdirSync(dest, { recursive: true });
  let count = 0;
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      count += copyMerge(srcPath, destPath, `${label}/${entry.name}`);
    } else {
      cpSync(srcPath, destPath);
      console.log(`  ✓ ${label}/${entry.name}`);
      count++;
    }
  }
  return count;
}

/** Vendor platform files → src/vendor/<prefix>/ (always overwrite). */
export function vendorPlatform(platform, projectDir) {
  const { manifest, pkgDir } = platform;
  return copyDir(
    resolve(pkgDir, manifest.vendor),
    resolve(projectDir, manifest.vendorDir),
    `${manifest.prefix} → ${manifest.vendorDir}/`,
  );
}

/** Sync platform docs → docs/<prefix>/ (always overwrite). */
export function syncPlatformDocs(platform, projectDir) {
  const { manifest, pkgDir } = platform;
  if (!manifest.docs) return 0;
  return copyDir(
    resolve(pkgDir, manifest.docs),
    resolve(projectDir, `docs/${manifest.prefix}`),
    `docs/${manifest.prefix}/`,
  );
}

/** Run full platform init: templates, vendor, docs, scripts, api. */
export function initPlatform(platform, projectDir) {
  const { manifest, pkgDir, name } = platform;
  console.log(`\n📦 Platform detected: ${name} (${manifest.prefix})\n`);
  copyMerge(resolve(pkgDir, manifest.templates), projectDir, 'templates');
  vendorPlatform(platform, projectDir);
  syncPlatformDocs(platform, projectDir);
  const skipScriptDirs = new Set(['lib']);
  if (manifest.scripts) {
    copySkipExisting(resolve(pkgDir, manifest.scripts), resolve(projectDir, 'scripts'), 'scripts', skipScriptDirs);
  }
  if (manifest.api) {
    copySkipExisting(resolve(pkgDir, manifest.api), resolve(projectDir, 'api'), 'api');
  }
}

/** Run platform update: re-vendor, sync docs, add new scripts/api. */
export function updatePlatform(platform, projectDir) {
  const { name, manifest, pkgDir } = platform;
  console.log(`\n📦 Platform: ${name} (${manifest.prefix})`);
  vendorPlatform(platform, projectDir);
  syncPlatformDocs(platform, projectDir);
  const skipScriptDirs = new Set(['lib']);
  if (manifest.scripts) {
    copySkipExisting(resolve(pkgDir, manifest.scripts), resolve(projectDir, 'scripts'), 'scripts', skipScriptDirs);
  }
  if (manifest.api) {
    copySkipExisting(resolve(pkgDir, manifest.api), resolve(projectDir, 'api'), 'api');
  }
}
