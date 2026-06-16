/**
 * OG metadata page generator — reads route config, resolves data sources,
 * and writes static HTML files with OG tags for social crawlers.
 * @module lib/build-og
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { injectMeta, interpolate } from './og-template.js';

/**
 * @typedef {Object} RouteConfig
 * @property {string} title @property {string} description
 * @property {string} [image] @property {string} [data] @property {string} [ogTemplate]
 */

/**
 * @typedef {Object} BuildOGOptions
 * @property {string} projectDir @property {string} [outDir] @property {string} [baseUrl]
 * @property {string} [htmlPath] @property {Record<string, unknown>} [context]
 */

/** Load route config from clearstack.routes.json or package.json. */
export function loadRoutes(projectDir) {
  const routesFile = resolve(projectDir, 'clearstack.routes.json');
  if (existsSync(routesFile)) {
    return JSON.parse(readFileSync(routesFile, 'utf-8'));
  }
  const pkgPath = resolve(projectDir, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    if (pkg.clearstack?.routes) return pkg.clearstack.routes;
  }
  return null;
}

/**
 * Resolve a data source reference like "data/traits.json:traits".
 * Supports arrays and objects (objects become arrays with key as slug).
 */
export function resolveDataSource(ref, projectDir) {
  const [filePart, ...pathParts] = ref.split(':');
  const jsonPath = pathParts.join(':');
  const filePath = resolve(projectDir, filePart);
  if (!existsSync(filePath)) return [];
  const content = JSON.parse(readFileSync(filePath, 'utf-8'));
  const data = jsonPath ? jsonPath.split('.').reduce((obj, key) => obj?.[key], content) : content;
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    return Object.entries(data).map(([key, val]) => ({ slug: key, ...val }));
  }
  return [data];
}

/** Generate OG pages for all configured routes. */
export function buildOG(opts) {
  const { projectDir, outDir = 'dist', baseUrl = '', htmlPath } = opts;
  const routes = loadRoutes(projectDir);
  if (!routes) {
    console.log('⚠ No routes config found. Create clearstack.routes.json');
    return { pages: 0, routes: 0 };
  }

  const shellPath = htmlPath || resolve(projectDir, 'src/index.html');
  if (!existsSync(shellPath)) {
    console.log(`⚠ HTML shell not found: ${shellPath}`);
    return { pages: 0, routes: 0 };
  }
  const shell = readFileSync(shellPath, 'utf-8');
  const out = resolve(projectDir, outDir);
  let pages = 0;

  const ctx = opts.context || {};

  for (const [pattern, config] of Object.entries(routes)) {
    const isDynamic = pattern.includes(':');

    if (!isDynamic) {
      const data = { app: { name: baseUrl }, ...ctx };
      const meta = resolveMeta(config, data, baseUrl, pattern);
      writePage(out, pattern, shell, meta);
      pages++;
    } else if (config.data) {
      const items = resolveDataSource(config.data, projectDir);
      const paramName = pattern.match(/:(\w+)/)?.[1] || 'id';
      for (const item of items) {
        const slug = item.slug || item.id || item[paramName];
        if (!slug) continue;
        const path = pattern.replace(`:${paramName}`, String(slug));
        const data = { [paramName]: item, item, app: { name: baseUrl }, ...ctx };
        const meta = resolveMeta(config, data, baseUrl, path);
        writePage(out, path, shell, meta);
        pages++;
      }
    }
  }

  console.log(`✅ Generated ${pages} OG pages from ${Object.keys(routes).length} routes`);
  return { pages, routes: Object.keys(routes).length };
}

/** Resolve meta from config + data context. */
function resolveMeta(config, data, baseUrl, path) {
  const imgField = config.ogImage || config.image;
  return {
    title: interpolate(config.title, data),
    description: interpolate(config.description, data),
    url: `${baseUrl}${path}`,
    image: imgField ? interpolate(imgField, data) : undefined,
  };
}

/** Write a single HTML page to the output directory. */
function writePage(outDir, routePath, shell, meta) {
  let filePath;
  if (routePath === '/') {
    filePath = resolve(outDir, 'index.html');
  } else {
    // Write as flat file (e.g. /dna-sources → dna-sources.html)
    // Cloudflare Pages serves dna-sources.html for /dna-sources without redirect
    filePath = resolve(outDir, routePath.slice(1) + '.html');
  }
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, injectMeta(shell, meta));
}
