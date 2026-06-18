/**
 * OG image generator — renders HTML templates with Playwright, saves PNGs.
 * Generates 1200×630 social preview images per route from the same data
 * sources used by the OG HTML page builder.
 * @module lib/build-og-images
 */

import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { loadRoutes, resolveDataSource } from './build-og.js';
import { resolveTemplate, renderTemplate, buildContext, loadTokens, WIDTH, HEIGHT } from './og-image-template.js';

/**
 * @typedef {Object} BuildOGImagesOptions
 * @property {string} projectDir
 * @property {string} [outDir] - Default: "dist"
 * @property {string} [logo] - Path or URL to logo
 * @property {string} [siteName] - Site name for badge
 * @property {Record<string, unknown>} [context] - Extra interpolation data
 * @property {(slug: string) => boolean} [filter] - Only render matching slugs
 * @property {(slug: string, n: number, total: number) => void} [onProgress]
 */

/**
 * Generate OG images for all configured routes.
 * @param {BuildOGImagesOptions} opts
 * @returns {Promise<{ images: number, routes: number }>}
 */
export async function buildOGImages(opts) {
  const { projectDir, outDir = 'dist', logo, siteName, context = {}, filter, onProgress } = opts;
  const routes = loadRoutes(projectDir);
  if (!routes) {
    console.log('⚠ No routes config found. Create clearstack.routes.json');
    return { images: 0, routes: 0 };
  }

  const tokens = loadTokens(projectDir);
  const site = { tokens, logo, siteName };
  const start = performance.now();

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH });
  console.log('  Browser ready, rendering...');
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
  const out = resolve(projectDir, outDir);
  let images = 0;

  for (const [pattern, config] of Object.entries(routes)) {
    const template = resolveTemplate(projectDir, config.ogTemplate);
    const isDynamic = pattern.includes(':');

    if (!isDynamic) {
      if (filter) continue;
      const data = { app: { name: siteName }, ...context };
      const ctx = buildContext(config, data, site);
      await screenshot(page, renderTemplate(template, ctx, projectDir), out, pattern);
      images++;
    } else if (config.data) {
      const items = resolveDataSource(config.data, projectDir);
      const paramName = pattern.match(/:(\w+)/)?.[1] || 'id';
      for (const item of items) {
        const slug = item.slug || item.id || item.sku || item[paramName];
        if (!slug) continue;
        if (filter && !filter(String(slug))) continue;
        const path = pattern.replace(`:${paramName}`, String(slug));
        const data = { [paramName]: item, item, app: { name: siteName }, ...context };
        const ctx = buildContext(config, data, site);
        await screenshot(page, renderTemplate(template, ctx, projectDir), out, path);
        images++;
        if (onProgress) onProgress(String(slug), images, -1);
      }
    }
  }

  await browser.close();
  const elapsed = ((performance.now() - start) / 1000).toFixed(1);
  console.log(`✅ Generated ${images} OG images from ${Object.keys(routes).length} route(s) (${elapsed}s)`);
  return { images, routes: Object.keys(routes).length };
}

/**
 * Build a single OG image for one slug (fast iteration).
 * @param {BuildOGImagesOptions & { slug: string }} opts
 * @returns {Promise<string>} Path to generated image
 */
export async function buildOneOGImage(opts) {
  const { projectDir, outDir = 'dist', logo, siteName, slug, context = {} } = opts;
  const routes = loadRoutes(projectDir);
  if (!routes) throw new Error('No routes config found');

  const tokens = loadTokens(projectDir);
  const site = { tokens, logo, siteName };
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH });
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
  const out = resolve(projectDir, outDir);
  let result = '';

  for (const [pattern, config] of Object.entries(routes)) {
    if (!pattern.includes(':') || !config.data) continue;
    const template = resolveTemplate(projectDir, config.ogTemplate);
    const items = resolveDataSource(config.data, projectDir);
    const paramName = pattern.match(/:(\w+)/)?.[1] || 'id';
    const item = items.find((i) => (i.slug || i.id || i.sku) === slug);
    if (!item) continue;
    const path = pattern.replace(`:${paramName}`, String(slug));
    const data = { [paramName]: item, item, app: { name: siteName }, ...context };
    const ctx = buildContext(config, data, site);
    await screenshot(page, renderTemplate(template, ctx, projectDir), out, path);
    result = resolve(out, path.slice(1) + '.png');
    break;
  }

  await browser.close();
  if (result) console.log(`✅ ${result}`);
  else console.log(`⚠ Slug "${slug}" not found in any route data`);
  return result;
}

/** Render HTML content and save screenshot to disk. */
async function screenshot(page, html, outDir, routePath) {
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(html.includes('fonts.googleapis') ? 2500 : 800);
  const imgPath = routePath === '/'
    ? resolve(outDir, 'og-image.png')
    : resolve(outDir, routePath.slice(1) + '.png');
  mkdirSync(dirname(imgPath), { recursive: true });
  await page.screenshot({ path: imgPath, type: 'png' });
}
