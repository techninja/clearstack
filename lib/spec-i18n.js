/**
 * i18n readiness check — detects patterns, locale files, hardcoded prose density.
 * Always passes (informational). Surfaces coverage gaps without blocking the build.
 * @module lib/spec-i18n
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { findFiles, elapsed } from './spec-utils.js';

/** @typedef {import('./spec-utils.js').CheckResult} CheckResult */

const PROSE_RE = />\s*[A-Z][a-z]{2,}[^<$`\\]{3,}\s*[<$]/g;
const T_RE = /\bt\s*\(/;
const MSG_RE = /\bmsg`/;
const LOC_RE = /\blocalize\s*\(/;
const INIT_RE = /loadLocale|localize\s*\(/;
const TPL_RE = /html`[\s\S]*?`/g;

/** Strip leading > and trailing <$ from a prose match, trim. */
const cleanHit = (h) => h.replace(/^>\s*/, '').replace(/\s*[<$]$/, '').trim();

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

  let usesT = 0,
    usesMsg = 0,
    usesLocalize = 0,
    hasInit = false,
    hardcodedHits = 0,
    templateFiles = 0;
  /** @type {Array<{file: string, text: string, line: number}>} */
  const verboseHits = [];

  for (const file of srcFiles) {
    const src = readFileSync(resolve(root, file), 'utf-8');
    if (T_RE.test(src)) usesT++;
    if (MSG_RE.test(src)) usesMsg++;
    if (LOC_RE.test(src)) usesLocalize++;
    if (/router\/index|app.*init|main\.js/.test(file) && INIT_RE.test(src)) hasInit = true;
    const templates = src.match(TPL_RE);
    if (templates) {
      templateFiles++;
      for (const tpl of templates) {
        const hits = tpl.match(PROSE_RE);
        if (hits) {
          hardcodedHits += hits.length;
          if (opts?.verbose) {
            for (const h of hits) {
              const text = cleanHit(h);
              const idx = src.indexOf(text);
              const line = idx >= 0 ? src.slice(0, idx).split('\n').length : 0;
              verboseHits.push({ file, text, line });
            }
          }
        }
      }
    }
  }

  const localesDir = existsSync(resolve(root, 'src/locales'))
    ? resolve(root, 'src/locales')
    : existsSync(resolve(root, 'locales'))
      ? resolve(root, 'locales')
      : null;

  const localeFiles = localesDir
    ? readdirSync(localesDir).filter((f) => f.endsWith('.json') && f !== 'overrides.json')
    : [];
  const languages = localeFiles.map((f) => f.replace(/\.json$/, '').replace(/^overrides\./, ''));
  const hasOverrides = localesDir ? existsSync(resolve(localesDir, 'overrides.json')) : false;

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
    const unwrapped = hardcodedHits > 0 ? `\n     Unwrapped: ~${hardcodedHits} prose strings across ${templateFiles} template files` : '';
    console.log(`  ${icon} ${label} (${time})\n     Pattern:   ${pattern}\n     Init:      ${init}${unwrapped}`);
    if (opts?.verbose && verboseHits.length) {
      console.log('');
      const byFile = {};
      for (const v of verboseHits) {
        (byFile[v.file] ||= []).push(v);
      }
      for (const [file, entries] of Object.entries(byFile)) {
        console.log(`     ${file}`);
        for (const e of entries) {
          const truncated = e.text.length > 60 ? e.text.slice(0, 60) + '\u2026' : e.text;
          console.log(`       L${e.line || '?'} ${truncated}`);
        }
      }
    }
  }

  return { pass: true, label, time };
}
