/**
 * Template file copier — copies files with {{variable}} replacement.
 * @module lib/copy
 */

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const TEMPLATE_RE = /\{\{(\w+)\}\}/g;

/** Files renamed during copy (npm strips .gitignore from packages). */
const RENAME = { gitignore: '.gitignore' };

/** Files that merge (append missing lines) instead of overwriting. */
const MERGE = new Set(['.gitignore']);

/**
 * Recursively copy a template directory, replacing {{vars}} in file contents.
 * @param {string} templateRoot - Root templates/ directory
 * @param {string} templateName - 'shared', 'fullstack', or 'static'
 * @param {string} dest - Destination project directory
 * @param {Record<string, string|number>} vars - Template variables
 */
export async function copyTemplates(templateRoot, templateName, dest, vars) {
  const src = resolve(templateRoot, templateName);
  await copyDir(src, dest, vars);
}

/**
 * @param {string} src
 * @param {string} dest
 * @param {Record<string, string|number>} vars
 */
async function copyDir(src, dest, vars) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destName = RENAME[entry.name] || entry.name;
    const destPath = join(dest, destName);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath, vars);
    } else {
      const content = readFileSync(srcPath, 'utf-8');
      const replaced = content.replace(TEMPLATE_RE, (_, key) =>
        vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`,
      );
      if (MERGE.has(destName) && existsSync(destPath)) {
        mergeLines(destPath, replaced);
      } else {
        writeFileSync(destPath, replaced);
      }
    }
  }
}

/**
 * Append lines from source that don't already exist in the destination file.
 * @param {string} destPath
 * @param {string} newContent
 */
function mergeLines(destPath, newContent) {
  const existing = readFileSync(destPath, 'utf-8');
  const existingLines = new Set(existing.split('\n').map((l) => l.trim()));
  const toAdd = newContent.split('\n')
    .filter((l) => l.trim() && !existingLines.has(l.trim()));
  if (toAdd.length > 0) {
    const sep = existing.endsWith('\n') ? '' : '\n';
    writeFileSync(destPath, existing + sep + toAdd.join('\n') + '\n');
  }
}
