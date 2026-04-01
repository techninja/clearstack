#!/usr/bin/env node

/**
 * Release helper — bumps scaffolder version, syncs docs, commits, and tags.
 * Usage: node scripts/release.js [patch|minor|major]
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const bump = process.argv[2] || 'patch';

if (!['patch', 'minor', 'major'].includes(bump)) {
  console.error('Usage: node scripts/release.js [patch|minor|major]');
  process.exit(1);
}

const run = (cmd) => execSync(cmd, { cwd: ROOT, stdio: 'inherit' });

// Bump scaffolder version
const pkgPath = resolve(ROOT, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const [major, minor, patch] = pkg.version.split('.').map(Number);
const next = bump === 'major' ? `${major + 1}.0.0`
  : bump === 'minor' ? `${major}.${minor + 1}.0`
  : `${major}.${minor}.${patch + 1}`;

pkg.version = next;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`\n📦 Bumped scaffolder to v${next}\n`);

// Sync docs
run('node scripts/sync-docs.js');

// Git commit + tag
run('git add -A');
run(`git commit -m "release: v${next}"`);
run(`git tag v${next}`);

console.log(`\n🏷️  Tagged v${next}`);
console.log(`\n   Push with: git push && git push --tags\n`);
