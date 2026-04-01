/**
 * Template file copier — copies files with {{variable}} replacement.
 * @module lib/copy
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const TEMPLATE_RE = /\{\{(\w+)\}\}/g;

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
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath, vars);
    } else {
      const content = readFileSync(srcPath, 'utf-8');
      const replaced = content.replace(TEMPLATE_RE, (_, key) =>
        vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`,
      );
      writeFileSync(destPath, replaced);
    }
  }
}
