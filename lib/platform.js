/**
 * Platform stacking — detect, vendor, and scaffold platform layers.
 * @module lib/platform
 */

import {
  cpSync, existsSync, mkdirSync, readFileSync, readdirSync,
} from 'node:fs';
import { resolve, join } from 'node:path';

/**
 * @typedef {Object} PlatformManifest
 * @property {string} prefix
 * @property {string} vendorDir
 * @property {string} configFile
 * @property {string} templates
 * @property {string} vendor
 * @property {string} [docs]
 * @property {string} [scripts]
 * @property {string} [api]
 */

/** @typedef {{ name: string, pkgDir: string, manifest: PlatformManifest }} DetectedPlatform */

/**
 * Detect platforms in the project's dependencies.
 * @param {string} projectDir
 * @returns {DetectedPlatform[]}
 */
export function detectPlatforms(projectDir) {
  const pkgPath = resolve(projectDir, 'package.json');
  if (!existsSync(pkgPath)) return [];
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  /** @type {DetectedPlatform[]} */
  const platforms = [];
  for (const name of Object.keys(allDeps)) {
    const depPkg = resolve(projectDir, 'node_modules', name, 'package.json');
    if (!existsSync(depPkg)) continue;
    const dep = JSON.parse(readFileSync(depPkg, 'utf-8'));
    if (!dep.clearstack?.platform) continue;
    platforms.push({
      name,
      pkgDir: resolve(projectDir, 'node_modules', name),
      manifest: dep.clearstack.platform,
    });
  }
  return platforms;
}

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
 * @param {string} src
 * @param {string} dest
 * @param {string} label
 */
function copySkipExisting(src, dest, label) {
  if (!existsSync(src)) return 0;
  mkdirSync(dest, { recursive: true });
  let count = 0;
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const destPath = join(dest, entry.name);
    if (existsSync(destPath)) {
      console.log(`  ⏭ Skipped: ${label}/${entry.name} (exists)`);
      continue;
    }
    cpSync(join(src, entry.name), destPath, { recursive: entry.isDirectory() });
    console.log(`  ✓ Created: ${label}/${entry.name}`);
    count++;
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

/** Run full platform init: templates, vendor, docs, scripts, api. */
export function initPlatform(platform, projectDir) {
  const { manifest, pkgDir, name } = platform;
  console.log(`\n📦 Platform detected: ${name} (${manifest.prefix})\n`);
  copyMerge(resolve(pkgDir, manifest.templates), projectDir, 'templates');
  vendorPlatform(platform, projectDir);
  syncPlatformDocs(platform, projectDir);
  if (manifest.scripts) {
    copySkipExisting(resolve(pkgDir, manifest.scripts), resolve(projectDir, 'scripts'), 'scripts');
  }
  if (manifest.api) {
    copySkipExisting(resolve(pkgDir, manifest.api), resolve(projectDir, 'api'), 'api');
  }
}

/** Run platform update: re-vendor + sync docs only. */
export function updatePlatform(platform, projectDir) {
  const { name, manifest } = platform;
  console.log(`\n📦 Platform: ${name} (${manifest.prefix})`);
  vendorPlatform(platform, projectDir);
  syncPlatformDocs(platform, projectDir);
}
