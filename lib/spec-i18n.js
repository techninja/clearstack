/**
 * i18n readiness check — uses Hybrids extract when available, falls back to regex.
 * Always passes (informational). Surfaces coverage gaps without blocking the build.
 * @module lib/spec-i18n
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { elapsed } from './spec-utils.js';
import { findFiles } from './spec-scan.js';
import { tryHybridsExtract, loadLocales, parseLocaleJson } from './spec-i18n-locales.js';

/** @typedef {import('./spec-utils.js').CheckResult} CheckResult */

const T_RE = /\bt\s*\(/;
const MSG_RE = /\bmsg`/;
const LOC_RE = /\blocalize\s*\(/;

/**
 * Extract keys from the DEFAULTS object in a t()-based i18n.js file.
 * @param {string} root
 * @returns {string[]|null}
 */
function extractTDefaults(root) {
  const candidates = ['src/utils/i18n.js', 'src/i18n.js', 'utils/i18n.js'];
  for (const rel of candidates) {
    const p = resolve(root, rel);
    if (!existsSync(p)) continue;
    const src = readFileSync(p, 'utf-8');
    const block = src.match(/const DEFAULTS\s*=\s*\{([\s\S]*?)\};/);
    if (!block) continue;
    const keys = [];
    const re = /['"]([\.\w]+)['"]\s*:/g;
    let m;
    while ((m = re.exec(block[1])) !== null) keys.push(m[1]);
    if (keys.length) return keys;
  }
  return null;
}

/**
 * Check i18n readiness — informational, always passes.
 * @param {string} root
 * @param {string[]} ignoreDirs
 * @param {string} label
 * @param {{ quiet?: boolean, verbose?: boolean }} [opts]
 * @returns {Promise<CheckResult>}
 */
export async function checkI18n(root, ignoreDirs, label, opts) {
  const start = performance.now();

  const srcFiles = findFiles(root, ['.js'], ignoreDirs, root).filter(
    (f) =>
      f.startsWith('src/') &&
      !f.includes('vendor/') &&
      !f.includes('deps/') &&
      !f.endsWith('.test.js'),
  );

  let usesT = 0, usesMsg = 0, usesLocalize = 0;
  for (const file of srcFiles) {
    const src = readFileSync(resolve(root, file), 'utf-8');
    if (T_RE.test(src)) usesT++;
    if (MSG_RE.test(src)) usesMsg++;
    if (LOC_RE.test(src)) usesLocalize++;
  }

  const localesDir = existsSync(resolve(root, 'src/locales'))
    ? resolve(root, 'src/locales')
    : existsSync(resolve(root, 'locales'))
      ? resolve(root, 'locales')
      : null;

  const hasOverrides = localesDir ? existsSync(resolve(localesDir, 'overrides.json')) : false;
  const extracted = await tryHybridsExtract(root);
  const extractedKeys = extracted ? Object.keys(extracted) : null;
  const locales = loadLocales(localesDir);

  const patternParts = [
    usesT ? `t() \u00d7${usesT}` : '',
    usesMsg ? `msg\` \u00d7${usesMsg}` : '',
    usesLocalize ? `localize() \u00d7${usesLocalize}` : '',
  ].filter(Boolean);

  const time = elapsed(start);
  const coverage = [];
  if (localesDir) {
    // Key source priority: t() DEFAULTS + overrides → hybrids extract → overrides.json alone
    const tKeys = extractTDefaults(root);
    const overrideKeys = hasOverrides
      ? [...parseLocaleJson(resolve(localesDir, 'overrides.json'))]
      : [];
    const masterKeys = tKeys
      ? [...new Set([...tKeys, ...overrideKeys])]
      : (extractedKeys ?? (overrideKeys.length ? overrideKeys : null));
    if (masterKeys?.length && locales.length) {
      for (const loc of locales) {
        const translated = masterKeys.filter((k) => loc.keys.has(k)).length;
        const pct = Math.round((translated / masterKeys.length) * 100);
        const missing = masterKeys.length - translated;
        coverage.push({ lang: loc.lang, pct, missing, total: masterKeys.length });
      }
    }
  }

  const coverageDetail = coverage.length
    ? coverage.map((c) => `${c.lang} ${c.pct}%${c.missing ? ` (${c.missing} missing)` : ' ✓'}`).join(' · ')
    : (locales.length === 0 ? 'en only' : '');

  if (!opts?.quiet) {
    const icon = patternParts.length ? '✅' : '⚠️ ';
    const detail = coverageDetail || (patternParts.length ? patternParts.join(', ') : 'no i18n patterns detected');
    console.log(`  ${icon} ${label} — ${detail} (${time})`);
  }

  return { pass: true, label, time, detail: coverageDetail };
}
