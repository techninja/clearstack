/**
 * OG metadata HTML template generator.
 * Injects Open Graph + Twitter Card meta tags into an HTML shell.
 * @module lib/og-template
 */

/**
 * @typedef {Object} OGMeta
 * @property {string} title
 * @property {string} description
 * @property {string} url
 * @property {string} [image]
 * @property {string} [siteName]
 */

/**
 * Build the meta tag block for a page.
 * @param {OGMeta} meta
 * @returns {string}
 */
export function buildMetaTags(meta) {
  const tags = [
    `<title>${meta.title}</title>`,
    `<meta name="description" content="${esc(meta.description)}">`,
    `<meta property="og:title" content="${esc(meta.title)}">`,
    `<meta property="og:description" content="${esc(meta.description)}">`,
    `<meta property="og:url" content="${esc(meta.url)}">`,
    `<meta property="og:type" content="website">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(meta.title)}">`,
    `<meta name="twitter:description" content="${esc(meta.description)}">`,
  ];
  if (meta.siteName) {
    tags.push(`<meta property="og:site_name" content="${esc(meta.siteName)}">`);
  }
  if (meta.image) {
    tags.push(`<meta property="og:image" content="${esc(meta.image)}">`);
    tags.push(`<meta name="twitter:image" content="${esc(meta.image)}">`);
  }
  return tags.join('\n    ');
}

/**
 * Inject OG meta tags into an HTML shell (replaces <title> and existing OG/twitter meta).
 * @param {string} html - The base index.html content
 * @param {OGMeta} meta
 * @returns {string}
 */
export function injectMeta(html, meta) {
  const tags = buildMetaTags(meta);
  // Strip existing OG and twitter meta tags (single or multi-line)
  let cleaned = html.replace(/\s*<meta\s+(?:property="og:[^"]*"|name="twitter:[^"]*")[^>]*\/?>/g, '');
  // Also strip standalone name="description" meta
  cleaned = cleaned.replace(/\s*<meta\s+name="description"[^>]*\/?>/g, '');
  // Replace existing <title>...</title> with full meta block
  cleaned = cleaned.replace(/<title>[^<]*<\/title>/, tags);
  return cleaned;
}

/**
 * Interpolate template strings like "{trait.name}" against a data object.
 * Supports dot notation: "{trait.emoji}" → data.trait.emoji
 * @param {string} template
 * @param {Record<string, unknown>} data
 * @returns {string}
 */
export function interpolate(template, data) {
  return template.replace(/\{([^}]+)\}/g, (_, path) => {
    const val = path.split('.').reduce((obj, key) => obj?.[key], data);
    return val !== null && val !== undefined ? String(val) : '';
  });
}

/** @param {string} str */
function esc(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
