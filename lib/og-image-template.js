/**
 * OG image template resolver — finds the right template for a route,
 * renders it with interpolated data, ready for Playwright screenshot.
 * @module lib/og-image-template
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { interpolate } from './og-template.js';
import { builtinTemplate } from './og-default-template.js';

const WIDTH = 1200;
const HEIGHT = 630;

/**
 * Resolve template HTML for a route.
 * Priority: route-specific → project default → built-in.
 * @param {string} projectDir
 * @param {string} [templateName]
 */
export function resolveTemplate(projectDir, templateName) {
  if (templateName) {
    const custom = resolve(projectDir, `src/og-templates/${templateName}.html`);
    if (existsSync(custom)) return readFileSync(custom, 'utf-8');
  }
  const projectDefault = resolve(projectDir, 'src/og-templates/default.html');
  if (existsSync(projectDefault)) return readFileSync(projectDefault, 'utf-8');
  return builtinTemplate(WIDTH, HEIGHT);
}

/**
 * Render a template with data context, inlining local assets as data URIs.
 * @param {string} template
 * @param {Record<string, unknown>} data
 * @param {string} projectDir
 */
export function renderTemplate(template, data, projectDir) {
  let html = interpolate(template, data);
  html = html.replace(/src="\/([^"]+)"/g, (_, p) => {
    const abs = resolve(projectDir, 'src', p);
    if (!existsSync(abs)) return `src=""`;
    const ext = p.split('.').pop();
    const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
    return `src="data:${mime};base64,${readFileSync(abs).toString('base64')}"`;
  });
  return html;
}

/** Load CSS variables from a project's token file if available. */
export function loadTokens(projectDir) {
  const paths = ['src/styles/tokens.css', 'src/styles/base.css', 'src/styles/global.css'];
  for (const p of paths) {
    const full = resolve(projectDir, p);
    if (!existsSync(full)) continue;
    const css = readFileSync(full, 'utf-8');
    const vars = {};
    for (const m of css.matchAll(/--([^:]+):\s*([^;]+)/g)) vars[m[1].trim()] = m[2].trim();
    if (Object.keys(vars).length) return vars;
  }
  return {};
}

/**
 * Build the full data context for template rendering.
 * @param {{ title: string, description?: string, image?: string }} config
 * @param {Record<string, unknown>} itemData
 * @param {{ tokens?: Record<string, string>, logo?: string, siteName?: string }} site
 */
export function buildContext(config, itemData, site) {
  const t = site.tokens || {};
  const title = interpolate(config.title, itemData);
  const desc = config.description ? interpolate(config.description, itemData) : '';
  const image = config.image ? interpolate(config.image, itemData) : '';
  const item = itemData.item || {};
  const emoji = item.emoji || itemData.emoji || '';

  return {
    ...itemData, ...item,
    title: truncate(title, 60),
    description: truncate(desc, 120),
    bg: t['color-bg'] || '#0f172a',
    surface: t['color-surface'] || '#1e293b',
    primary: t['color-primary'] || '#818cf8',
    accent: t['color-accent'] || '#34d399',
    text: t['color-text'] || '#e2e8f0',
    textMuted: t['color-text-muted'] || '#a8b8cc',
    emoji, image,
    variantsFormatted: formatNum(item.expected_variants),
    uniqueFormatted: formatNum(item.estimated_unique_variants),
    imageHtml: image ? `<img class="hero" src="${image}">` : '',
    cardClass: image ? 'card-with-image' : '',
    logoHtml: site.logo ? `<img class="logo" src="${site.logo}">` : '',
    badgeHtml: site.siteName ? `<div class="badge">${site.siteName}</div>` : '',
    emojiHtml: emoji ? `<div class="emoji">${emoji}</div>` : '',
  };
}

/** Format large numbers with K/M suffix. */
function formatNum(n) {
  if (!n) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return String(n);
}

/** @param {string} str @param {number} max */
function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

export { WIDTH, HEIGHT };
