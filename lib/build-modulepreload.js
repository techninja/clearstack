/**
 * Module preload builder — statically crawls ES module imports and injects
 * <link rel="modulepreload"> tags into index.html so the browser fetches all
 * modules in parallel instead of chaining waterfall requests.
 * @module lib/build-modulepreload
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, relative, extname } from 'node:path';

/**
 * @param {string} srcDir - The src/ directory to crawl
 * @param {string} entryFile - Relative path to entry (e.g. 'router/index.js')
 * @param {string[]} ignoreDirs - Dirs to skip (e.g. ['vendor', 'deps'])
 * @returns {string[]} Ordered list of module paths (entry last)
 */
export function crawlModules(srcDir, entryFile, ignoreDirs = ['vendor', 'deps']) {
  const visited = new Set();
  const order = [];

  /**
   *
   */
  function crawl(relPath) {
    if (visited.has(relPath)) return;
    visited.add(relPath);
    if (ignoreDirs.some((d) => relPath.includes(`/${d}/`) || relPath.startsWith(`${d}/`))) return;

    const absPath = resolve(srcDir, relPath);
    if (!existsSync(absPath) || extname(absPath) !== '.js') return;

    const src = readFileSync(absPath, 'utf-8');
    const importRe = /(?:^|\n)\s*import\s[^'"]*['"]([^'"]+)['"]/g;
    let m;
    while ((m = importRe.exec(src)) !== null) {
      const spec = m[1];
      if (spec.startsWith('#')) {
        // Import map alias — resolve via known prefixes
        const mapped = resolveAlias(spec, relPath);
        if (mapped) crawl(mapped);
      } else if (spec.startsWith('./') || spec.startsWith('../')) {
        const abs = resolve(dirname(resolve(srcDir, relPath)), spec);
        const rel = relative(srcDir, abs.endsWith('.js') ? abs : abs + '.js');
        crawl(rel);
      }
      // Skip bare specifiers (vendor/hybrids handled separately)
    }
    order.push(relPath);
  }

  crawl(entryFile);
  return order;
}

/** Resolve #alias/ import map specifiers to relative paths. */
function resolveAlias(spec, fromFile) {
  const aliases = {
    '#store/': 'store/',
    '#utils/': 'utils/',
    '#atoms/': 'components/atoms/',
    '#molecules/': 'components/molecules/',
    '#organisms/': 'components/organisms/',
    '#templates/': 'components/templates/',
    '#pages/': 'pages/',
  };
  for (const [prefix, dir] of Object.entries(aliases)) {
    if (spec.startsWith(prefix)) return dir + spec.slice(prefix.length);
  }
  return null;
}

/**
 * Inject modulepreload tags into index.html.
 * @param {{ projectDir: string, srcDir?: string, outDir?: string, entry?: string, ignore?: string[] }} opts
 * @returns {{ modules: number }}
 */
export function buildModulePreload(opts) {
  const {
    projectDir,
    srcDir = resolve(projectDir, 'src'),
    outDir = resolve(projectDir, 'dist'),
    entry = 'router/index.js',
    ignore = ['vendor', 'deps'],
  } = opts;

  const indexPath = resolve(outDir, 'index.html');
  if (!existsSync(indexPath)) {
    console.log('⚠ dist/index.html not found — run build first');
    return { modules: 0 };
  }

  const modules = crawlModules(srcDir, entry, ignore);
  const tags = modules.map((m) => `  <link rel="modulepreload" href="/${m}">`).join('\n');

  let html = readFileSync(indexPath, 'utf-8');
  if (html.includes('rel="modulepreload"')) {
    // Remove existing preload tags before re-injecting
    html = html.replace(/\s*<link rel="modulepreload"[^>]*>/g, '');
  }
  html = html.replace('</head>', `${tags}\n</head>`);
  writeFileSync(indexPath, html);

  console.log(`✅ Modulepreload: ${modules.length} modules → dist/index.html`);
  return { modules: modules.length };
}
