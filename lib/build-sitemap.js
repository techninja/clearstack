/**
 * Sitemap generator — builds sitemap.xml from clearstack.routes.json.
 * Static routes get one URL each; dynamic routes iterate their data source.
 * @module lib/build-sitemap
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadRoutes, resolveDataSource } from './build-og.js';
import { interpolate } from './og-template.js';

/** @param {string} s */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/'/g, '&apos;');

/** Default priority by route type. */
function defaultPriority(pattern) {
  if (pattern === '/') return '1.0';
  if (pattern.includes(':')) return '0.5';
  return '0.7';
}

/** Default changefreq by route type. */
function defaultChangefreq(pattern) {
  if (pattern === '/') return 'daily';
  if (pattern.includes(':')) return 'weekly';
  return 'monthly';
}

/**
 * @param {string} date - ISO date string or empty
 * @returns {string}
 */
function fmtDate(date) {
  if (!date) return '';
  try { return new Date(date).toISOString().slice(0, 10); } catch { return ''; }
}

/**
 * Build sitemap.xml from route config.
 * @param {{ projectDir: string, outDir?: string, baseUrl: string, context?: Record<string, unknown> }} opts
 * @returns {{ urls: number }}
 */
export function buildSitemap(opts) {
  const { projectDir, outDir = 'dist', baseUrl, context = {} } = opts;
  const routes = loadRoutes(projectDir);
  if (!routes) {
    console.log('⚠ No routes config found. Create clearstack.routes.json');
    return { urls: 0 };
  }

  const urls = [];

  for (const [pattern, config] of Object.entries(routes)) {
    const sm = config.sitemap || {};
    const priority = sm.priority ?? defaultPriority(pattern);
    const changefreq = sm.changefreq ?? defaultChangefreq(pattern);
    const isDynamic = pattern.includes(':');

    if (!isDynamic) {
      const lastmod = fmtDate(sm.lastmod || '');
      urls.push(entry(`${baseUrl}${pattern}`, changefreq, String(priority), lastmod));
    } else if (config.data) {
      const items = resolveDataSource(config.data, projectDir);
      const paramName = pattern.match(/:(\w+)/)?.[1] || 'id';
      for (const item of items) {
        const slug = item.slug || item.id || item.sku || item[paramName];
        if (!slug) continue;
        const path = pattern.replace(`:${paramName}`, String(slug));
        const data = { [paramName]: item, item, ...context };
        const resolvedPath = interpolate(path, data);
        const lastmod = fmtDate(item.date || item.modified || item.created || '');
        urls.push(entry(`${baseUrl}${resolvedPath}`, changefreq, String(priority), lastmod));
      }
    }
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
  ].join('\n');

  const out = resolve(projectDir, outDir);
  mkdirSync(out, { recursive: true });
  writeFileSync(resolve(out, 'sitemap.xml'), xml);
  console.log(`✅ Sitemap: ${urls.length} URLs → ${outDir}/sitemap.xml`);
  return { urls: urls.length };
}

/** Build a single <url> entry. */
function entry(loc, changefreq, priority, lastmod) {
  return [
    '  <url>',
    `    <loc>${esc(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : '',
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n');
}
