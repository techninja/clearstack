/**
 * Platform stacking — detect platforms in project dependencies.
 * File operations live in platform-files.js.
 * @module lib/platform
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export {
  vendorPlatform, syncPlatformDocs, initPlatform, updatePlatform,
} from './platform-files.js';

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
