#!/usr/bin/env node

/**
 * Release helper — bumps version, generates changelog, syncs docs, commits, tags.
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
const out = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf-8' }).trim();

// Bump version
const pkgPath = resolve(ROOT, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const [major, minor, patch] = pkg.version.split('.').map(Number);
const next =
  bump === 'major'
    ? `${major + 1}.0.0`
    : bump === 'minor'
      ? `${major}.${minor + 1}.0`
      : `${major}.${minor}.${patch + 1}`;

pkg.version = next;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`\n📦 Bumped to v${next}\n`);

// Generate changelog entry from commits since last tag
const lastTag = out('git tag --sort=-v:refname | head -1') || '';
const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
const log = out(`git log ${range} --pretty=format:"- %s"`);
const date = new Date().toISOString().split('T')[0];

const entry = `## [${next}] - ${date}\n\n${log || '- Initial release'}\n`;

// Prepend to CHANGELOG.md
const changelogPath = resolve(ROOT, 'CHANGELOG.md');
const changelog = readFileSync(changelogPath, 'utf-8');
const marker = '## [Unreleased]';
const updated = changelog.includes(marker)
  ? changelog.replace(marker, `${marker}\n\n${entry}`)
  : `${entry}\n\n${changelog}`;
writeFileSync(changelogPath, updated);
console.log(`📝 Updated CHANGELOG.md\n`);

// Sync docs
run('node scripts/sync-docs.js');

// Commit + tag
run('git add -A');
run(`git commit -m "release: v${next}"`);
run(`git tag v${next}`);

console.log(`\n🏷️  Tagged v${next}`);
console.log(`\n   git push && git push --tags\n`);
