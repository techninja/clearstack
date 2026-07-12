/**
 * Locale file parsing helpers for i18n spec check.
 * @module lib/spec-i18n-locales
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

/**
 * Try to run `npx hybrids extract ./src` and parse the JSON output.
 * @param {string} root
 * @returns {Record<string, object>|null}
 */
export function tryHybridsExtract(root) {
  const srcDir = resolve(root, 'src');
  if (!existsSync(srcDir)) return null;
  try {
    const out = execSync('npx hybrids extract ./src', {
      cwd: root,
      encoding: 'utf-8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return JSON.parse(out);
  } catch {
    return null;
  }
}

/**
 * Parse locale keys from a .js file that calls localize(lang, {...}).
 * Extracts top-level string keys from the object literal.
 * @param {string} filePath
 * @returns {Set<string>}
 */
export function parseLocaleJs(filePath) {
  const src = readFileSync(filePath, 'utf-8');
  const keys = new Set();
  const re = /^\s*(['"])(.*?)\1\s*:/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    const key = m[2].replace(/\\'/g, "'").replace(/\\"/g, '"');
    keys.add(key);
  }
  return keys;
}

/**
 * Parse locale keys from a .json file.
 * @param {string} filePath
 * @returns {Set<string>}
 */
export function parseLocaleJson(filePath) {
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    return new Set(Object.keys(data));
  } catch {
    return new Set();
  }
}

/**
 * Find locale files and return { lang, keys } for each.
 * @param {string} localesDir
 * @returns {Array<{lang: string, keys: Set<string>, file: string}>}
 */
export function loadLocales(localesDir) {
  if (!localesDir) return [];
  const files = readdirSync(localesDir);
  const locales = [];
  for (const f of files) {
    if (f === 'overrides.json' || f === 'en.json') continue;
    const full = resolve(localesDir, f);
    if (f.endsWith('.json')) {
      const lang = f.replace(/\.json$/, '');
      locales.push({ lang, keys: parseLocaleJson(full), file: f });
    } else if (f.endsWith('.js') && !f.includes('init')) {
      const lang = f.replace(/\.js$/, '');
      locales.push({ lang, keys: parseLocaleJs(full), file: f });
    }
  }
  return locales;
}
