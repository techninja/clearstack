/**
 * i18n readiness check — uses Hybrids extract when available, falls back to regex.
 * Always passes (informational). Surfaces coverage gaps without blocking the build.
 * @module lib/spec-i18n
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { findFiles, elapsed } from './spec-utils.js';
import { tryHybridsExtract, loadLocales } from './spec-i18n-locales.js';

/** @typedef {import('./spec-utils.js').CheckResult} CheckResult */

const PROSE_RE = />\s*[A-Z][a-z]{2,}[^<$`\\]{3,}\s*[<$]/g;
const T_RE = /\bt\s*\(/;
const MSG_RE = /\bmsg`/;
const LOC_RE = /\blocalize\s*\(/;
const INIT_RE = /loadLocale|localize\s*\(/;
const TPL_RE = /html`[\s\S]*?`/g;

/**
 * Check i18n readiness — informational, always passes.
 * @param {string} root
 * @param {string[]} ignoreDirs
 * @param {string} label
 * @param {{ quiet?: boolean, verbose?: boolean }} [opts]
 * @returns {CheckResult}
 */
export function checkI18n(root, ignoreDirs, label, opts) {
  const start = performance.now();

  const srcFiles = findFiles(root, ['.js'], ignoreDirs, root).filter(
    (f) =>
      f.startsWith('src/') &&
      !f.includes('vendor/') &&
      !f.includes('deps/') &&
      !f.endsWith('.test.js'),
  );

  let usesT = 0, usesMsg = 0, usesLocalize = 0, hasInit = false;
  for (const file of srcFiles) {
    const src = readFileSync(resolve(root, file), 'utf-8');
    if (T_RE.test(src)) usesT++;
    if (MSG_RE.test(src)) usesMsg++;
    if (LOC_RE.test(src)) usesLocalize++;
    if (/router\/index|app.*init|main\.js/.test(file) && INIT_RE.test(src)) hasInit = true;
  }

  const localesDir = existsSync(resolve(root, 'src/locales'))
    ? resolve(root, 'src/locales')
    : existsSync(resolve(root, 'locales'))
      ? resolve(root, 'locales')
      : null;

  const hasOverrides = localesDir ? existsSync(resolve(localesDir, 'overrides.json')) : false;
  const extracted = tryHybridsExtract(root);
  const extractedKeys = extracted ? Object.keys(extracted) : null;
  const locales = loadLocales(localesDir);
  const languages = locales.map((l) => l.lang);

  const patternParts = [
    usesT ? `t() \u00d7${usesT}` : '',
    usesMsg ? `msg\` \u00d7${usesMsg}` : '',
    usesLocalize ? `localize() \u00d7${usesLocalize}` : '',
  ].filter(Boolean);

  const time = elapsed(start);

  if (!opts?.quiet) {
    const icon = patternParts.length ? '\u2705' : '\u26a0\ufe0f ';
    const pattern = patternParts.length ? patternParts.join(', ') : 'none detected';
    const langs = languages.length ? languages.join(', ') : 'en only';
    const init = `${hasInit ? 'yes' : 'not detected'} \u00b7 Overrides: ${hasOverrides ? 'yes' : 'no'} \u00b7 Languages: ${langs}`;

    let coverage = '';
    if (extractedKeys && locales.length) {
      const total = extractedKeys.length;
      for (const loc of locales) {
        const translated = extractedKeys.filter((k) => loc.keys.has(k)).length;
        const pct = total > 0 ? Math.round((translated / total) * 100) : 0;
        const missing = total - translated;
        coverage += `\n     ${loc.lang}: ${translated}/${total} (${pct}%)${missing > 0 ? ` \u2014 ${missing} missing` : ' \u2714'}`;
      }
    } else if (extractedKeys) {
      coverage = `\n     Extracted: ${extractedKeys.length} translatable strings`;
    }

    let unwrapped = '';
    if (!extractedKeys) {
      let hardcodedHits = 0, templateFiles = 0;
      for (const file of srcFiles) {
        const src = readFileSync(resolve(root, file), 'utf-8');
        const templates = src.match(TPL_RE);
        if (templates) {
          templateFiles++;
          for (const tpl of templates) {
            const hits = tpl.match(PROSE_RE);
            if (hits) hardcodedHits += hits.length;
          }
        }
      }
      if (hardcodedHits > 0) {
        unwrapped = `\n     Unwrapped: ~${hardcodedHits} prose strings across ${templateFiles} template files`;
      }
    }

    console.log(`  ${icon} ${label} (${time})\n     Pattern:   ${pattern}\n     Init:      ${init}${coverage}${unwrapped}`);

    if (opts?.verbose && extractedKeys && locales.length) {
      for (const loc of locales) {
        const missing = extractedKeys.filter((k) => !loc.keys.has(k));
        if (missing.length) {
          console.log(`\n     Missing in ${loc.lang} (${missing.length}):`);
          for (const k of missing.slice(0, 50)) {
            const truncated = k.length > 70 ? k.slice(0, 70) + '\u2026' : k;
            console.log(`       \u2022 ${truncated}`);
          }
          if (missing.length > 50) console.log(`       \u2026 and ${missing.length - 50} more`);
        }
      }
    }
  }

  return { pass: true, label, time };
}
