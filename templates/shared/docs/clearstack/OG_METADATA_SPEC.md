# Spec-Driven OG Metadata Generation

## Problem

Every Clearstack site shares links that look blank in messaging apps. No title,
no description, no image. Social crawlers (Slack, Discord, Twitter, iMessage)
only read static HTML — they don't execute JavaScript. Since Clearstack apps are
SPAs with a single `index.html`, every shared link shows the same generic
metadata regardless of the actual page content.

## Solution

Clearstack generates two things from the route config:

1. **Static HTML shells** with OG meta tags (for crawlers)
2. **Dynamic OG images** (1200×630 PNGs rendered via Playwright)

Both are driven by the same `clearstack.routes.json` config and data sources.

## Route Config

```json
{
  "/trait/:slug": {
    "title": "{slug.name}",
    "description": "{slug.description}",
    "image": "{slug.cover_image.url}",
    "data": "src/data/trait_manifest.json:traits",
    "ogTemplate": "trait"
  },
  "/shop/product/:sku": {
    "title": "{sku.name} | {store.name}",
    "description": "{sku.description}",
    "image": "{store.url}{sku.images.0}",
    "data": "src/data/products.json",
    "ogTemplate": "product"
  }
}
```

### Fields

| Field         | Required | Description                                                 |
| ------------- | -------- | ----------------------------------------------------------- |
| `title`       | yes      | Template string with `{path.to.data}` interpolation         |
| `description` | yes      | Template string for meta description                        |
| `image`       | no       | Template string for og:image URL                            |
| `data`        | no       | Data source — `filepath:jsonPath` (supports arrays/objects) |
| `ogTemplate`  | no       | Template name → resolves to `src/og-templates/{name}.html`  |

### Data Sources

- **Arrays** — each item becomes a page
- **Objects** — entries become arrays with the key set as `slug`
- **JSON path** — dot notation into nested structures (e.g. `manifest.json:traits`)

## OG Image Templates

Templates are HTML files at `src/og-templates/` rendered by Playwright at
1200×630 and screenshotted to PNG.

### Resolution Order

1. `src/og-templates/{ogTemplate}.html` (route-specific)
2. `src/og-templates/default.html` (project default)
3. Built-in default (gradient card with title/description)

### Template Conventions

- Use `{tokenName}` interpolation for data (word chars + dots only)
- Local assets (`src="/logo.svg"`) are inlined as data URIs automatically
- Remote images (`https://...`) load via Playwright's network
- CSS custom properties from project tokens are injected into context
- Available computed fields: `{variantsFormatted}`, `{uniqueFormatted}`

### Available Context Variables

| Variable              | Source                                         |
| --------------------- | ---------------------------------------------- |
| `{title}`             | Resolved + truncated route title               |
| `{description}`       | Resolved + truncated description               |
| `{image}`             | Resolved image URL                             |
| `{emoji}`             | From item data                                 |
| `{bg}`, `{primary}`   | From project CSS tokens                        |
| `{variantsFormatted}` | Formatted number (K/M suffix)                  |
| All item fields       | Spread directly (e.g. `{name}`, `{pgs_count}`) |

## CLI Commands

```bash
# Generate OG HTML pages (for crawlers)
clearstack build og --url=https://mysite.com --out=dist

# Generate OG images (all routes)
clearstack build og-images --site=MySite --out=dist

# Generate a single image (fast iteration)
clearstack build og-images --slug=EFO_0004279 --site=MySite --out=dist/og

# Generate both HTML + images
clearstack build all --url=https://mysite.com --site=MySite --out=dist
```

### Flags

| Flag     | Description                        |
| -------- | ---------------------------------- |
| `--out`  | Output directory (default: `dist`) |
| `--url`  | Base URL for og:url tags           |
| `--site` | Site name for badge/branding       |
| `--logo` | Logo path or URL                   |
| `--slug` | Single item slug (fast iteration)  |

## Requirements

- Zero config for basic cases (route title + description → OG tags)
- Custom templates per page type via `ogTemplate` field
- Design tokens (CSS variables) automatically available in templates
- Local assets inlined as data URIs (no file:// security issues)
- Fast iteration: `--slug` flag renders one image in ~2s
- Full batch: 64 pages in <60s
- Works with any static deploy target (Cloudflare Pages, Netlify, Vercel)

## Dependencies

- **Playwright** (devDependency) — for OG image rendering
- No runtime dependencies — generated files are static PNGs + HTML
