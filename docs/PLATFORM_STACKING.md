# Platform Stacking

## How Clearstack Projects Become Scaffoldable Platforms

> A Clearstack project can declare itself as a **platform** — a reusable
> foundation that scaffolds child projects with vendor files, config schemas,
> and override layers. This spec defines the contract.

---

## The Problem

Clearstack scaffolds vanilla projects. But some Clearstack projects are
themselves platforms — they provide components, store models, API handlers,
and build scripts that other projects consume and customize.

Without a stacking API, each platform reinvents its own CLI, its own
vendor sync, its own override conventions, and its own update-without-
clobbering logic. That's the same problem Clearstack already solved for
itself.

## The Stack

```
Clearstack (spec + CLI)
  └── Platform (Clearstack project that declares itself scaffoldable)
       └── Project (consumes the platform, overrides what it needs)
```

Concrete example:

```
Clearstack v0.3.17
  └── StatiCart v1.x (e-commerce platform)
       └── "My Coffee Shop" (store built on StatiCart)
```

Each layer owns different things and has different update rules.

---

## 1. Platform Manifest

A Clearstack project becomes a platform by adding a `platform` key to its
`package.json`. This is the only requirement.

```json
{
  "name": "@techninja/staticart",
  "version": "1.0.0",
  "clearstack": {
    "platform": {
      "prefix": "staticart",
      "vendorDir": "src/vendor/staticart",
      "configFile": "staticart.config.json",
      "configSchema": "staticart.schema.json",
      "templates": "templates/",
      "vendor": "vendor/",
      "docs": "docs/staticart/",
      "scripts": "scripts/",
      "api": "api/"
    }
  }
}
```

### Manifest Fields

| Field          | Required | Purpose                                                          |
| -------------- | -------- | ---------------------------------------------------------------- |
| `prefix`       | Yes      | Import map prefix (`#staticart/`). Must be unique per platform.  |
| `vendorDir`    | Yes      | Where platform files land in the child project. Gitignored.      |
| `configFile`   | Yes      | Project-level config file name. Never overwritten on update.     |
| `configSchema` | No       | JSON Schema for the config file. Used for validation.            |
| `templates`    | Yes      | Directory in the npm package containing scaffold templates.      |
| `vendor`       | Yes      | Directory in the npm package containing vendorable source files. |
| `docs`         | No       | Platform docs synced to child project on update.                 |
| `scripts`      | No       | Build/admin scripts copied on init, skipped on update.           |
| `api`          | No       | API handler templates copied on init, skipped on update.         |

### The `prefix` Contract

The platform prefix becomes an import map namespace in the child project.
It follows the same `#prefix/` convention Clearstack uses for `#store/`,
`#atoms/`, etc.

```html
<script type="importmap">
  {
    "imports": {
      "#staticart/": "/vendor/staticart/",
      "#store/": "/store/",
      "#atoms/": "/components/atoms/"
    }
  }
</script>
```

The child project can override any platform module by remapping a specific
path before the wildcard:

```html
<script type="importmap">
  {
    "imports": {
      "#staticart/product-card": "/components/my-product-card.js",
      "#staticart/": "/vendor/staticart/"
    }
  }
</script>
```

Import map specificity rules (longer prefix wins) make this work natively.

---

## 2. File Ownership Model

Every file in a stacked project belongs to exactly one layer. The layer
determines who creates it, who updates it, and who must never touch it.

### Ownership Table

| Owner          | Creates                | Updates                       | Examples                                                 |
| -------------- | ---------------------- | ----------------------------- | -------------------------------------------------------- |
| **Clearstack** | `init`                 | `update` (always)             | `docs/clearstack/`, `.configs/`                          |
| **Platform**   | `init`                 | `update` (vendor + docs only) | `src/vendor/<prefix>/`, `docs/<prefix>/`                 |
| **Project**    | `init` (from template) | Never (project owns it)       | `src/components/`, config file, `tokens.css`, data files |

### The Three Update Behaviors

**Always overwrite:** Spec docs and vendor files. These are the platform's
source of truth. The child project must not edit them directly.

- `docs/clearstack/*.md`
- `docs/<prefix>/*.md`
- `src/vendor/<prefix>/`

**Create once, never overwrite:** Templates that the project customizes.
On `update`, these are skipped unless `--force` is passed.

- `.configs/*`
- `scripts/*`
- `api/` handlers
- `src/index.html`

**Never touch:** Project-owned files. No init or update command writes
to these after initial creation.

- Config file (`staticart.config.json`)
- `src/styles/tokens.css`
- `src/data/`
- `src/locales/overrides*.json`
- `src/components/` (project overrides)

---

## 3. CLI Integration

The Clearstack CLI gains platform awareness. No new top-level commands —
platforms hook into the existing `init` and `update` flow.

### `clearstack init`

Current behavior (unchanged):

1. Scaffold Clearstack project structure
2. Create `.configs/`, `docs/clearstack/`, `scripts/`, `src/`

New behavior when a platform is detected in `devDependencies`: 3. Read the platform's manifest from its `package.json` 4. Copy `templates/` → project root (respecting ownership rules) 5. Vendor `vendor/` → `src/vendor/<prefix>/` 6. Copy `docs/` → `docs/<prefix>/` 7. Copy `scripts/` → `scripts/` (skip existing) 8. Copy `api/` → `api/` (skip existing) 9. Generate import map entries for `#<prefix>/` 10. Create config file from template (if not exists)

### `clearstack update`

Current behavior (unchanged):

1. Sync `docs/clearstack/` (always overwrite)
2. Sync `.configs/` (skip existing, `--force` to overwrite)

New behavior when a platform is detected: 3. Re-vendor `vendor/` → `src/vendor/<prefix>/` (always overwrite) 4. Sync `docs/<prefix>/` (always overwrite) 5. Skip everything else (config, templates, scripts, api)

### Platform CLI Passthrough

A platform can also provide its own CLI commands via a `bin` entry. The
Clearstack CLI doesn't need to know about these — they're standard npm
bin scripts.

```json
{
  "bin": {
    "staticart": "./bin/cli.js"
  }
}
```

The platform CLI can call Clearstack's API programmatically for shared
operations (vendoring, doc sync) rather than reimplementing them.

---

## 4. Vendor Sync

Platform vendor files are the equivalent of Clearstack's `src/vendor/hybrids/`
pattern — source files copied from `node_modules` into the project so the
browser can serve them directly.

### How It Works

The platform's `vendor/` directory in the npm package contains the source
files that child projects consume. On `init` and `update`, these are copied
to `src/vendor/<prefix>/`.

```
node_modules/@techninja/staticart/vendor/
  ├── components/
  │   ├── atoms/
  │   ├── molecules/
  │   └── organisms/
  ├── store/
  ├── utils/
  └── styles/
```

Becomes:

```
src/vendor/staticart/
  ├── components/
  ├── store/
  ├── utils/
  └── styles/
```

### Vendor Directory Rules

- Always gitignored. Regenerated from the installed package version.
- Always overwritten on `update`. The platform owns these files.
- The child project never edits files in `src/vendor/<prefix>/`.
- To customize a vendored component, override it via the import map.

### `postinstall` Hook

The platform should provide a setup script that runs on `npm install`,
similar to how Clearstack's `vendor-deps.js` works:

```javascript
// In the platform's postinstall or the child project's setup.js
const PLATFORM_VENDOR = 'node_modules/@techninja/staticart/vendor';
const DEST = 'src/vendor/staticart';
cpSync(PLATFORM_VENDOR, DEST, { recursive: true });
```

This ensures vendor files stay in sync with the installed package version
without requiring a manual `clearstack update`.

---

## 5. Override Layers

A stacked project has multiple override layers. Each layer can customize
the one below it without forking.

### Component Overrides (Import Map)

The child project replaces a platform component by remapping its import:

```html
<script type="importmap">
  {
    "imports": {
      "#staticart/product-card": "/components/my-product-card.js",
      "#staticart/": "/vendor/staticart/"
    }
  }
</script>
```

The override component can:

- Replace the platform component entirely
- Import and wrap the original (decorator pattern)
- Import the original's helpers and compose differently

### Style Overrides (CSS Custom Properties)

The platform defines all visual properties as CSS custom properties in its
vendored `tokens.css`. The child project overrides them in its own
`tokens.css`, which loads after the platform's:

```css
/* src/styles/tokens.css — project overrides */
:root {
  --color-primary: #8b4513; /* coffee brown, overrides platform blue */
}
```

### Config Overrides (Config File)

The platform reads its config file at runtime. The child project owns
this file entirely. The platform provides defaults for any missing keys.

### i18n Overrides (Locale Files)

Four-layer cascade, split by responsibility:

| Layer               | Owner    | File                            | Purpose                  |
| ------------------- | -------- | ------------------------------- | ------------------------ |
| 1. Defaults         | Platform | Hardcoded in `i18n.js`          | English UI chrome        |
| 2. Locale           | Platform | `locales/<lang>.json`           | Translated UI chrome     |
| 3. Overrides        | Project  | `locales/overrides.json`        | English project terms    |
| 4. Locale overrides | Project  | `locales/overrides.<lang>.json` | Translated project terms |

The platform translates its own UI strings (buttons, labels, status text).
The project translates its own domain terms (category names, variant labels,
product descriptions). Neither layer needs to know about the other's keys.

---

## 6. Spec Check Composition

Clearstack's spec checks must work across the stack. The platform can
declare additional check requirements that compose with Clearstack's base
checks.

### What Composes Automatically

These Clearstack checks apply to all code regardless of layer:

- Line count limits (≤150 lines)
- Import map alias enforcement (no `../`)
- Prettier formatting
- ESLint rules
- Stylelint rules
- Security audit

### What the Platform Can Add

The platform manifest can declare additional `jsconfig.json` paths for
type checking:

```json
{
  "clearstack": {
    "platform": {
      "tscDomains": ["api/jsconfig.json"]
    }
  }
}
```

Clearstack's type checker auto-discovers `jsconfig.json` files, so this
usually works without explicit declaration. The manifest field exists for
edge cases where the platform needs type checking in non-standard locations.

### Vendor Files Are Excluded

Spec checks skip `src/vendor/` by default (already in `SPEC_IGNORE_DIRS`).
Platform vendor files are the platform's responsibility to keep compliant —
the child project doesn't lint them.

---

## 7. Multi-Platform Stacking

A project can consume multiple platforms. Each gets its own prefix,
vendor directory, and config file.

```html
<script type="importmap">
  {
    "imports": {
      "#staticart/": "/vendor/staticart/",
      "#blogengine/": "/vendor/blogengine/",
      "#store/": "/store/"
    }
  }
</script>
```

### Conflict Resolution

- Import map prefixes must be unique. Two platforms cannot use the same prefix.
- Config files must have different names.
- CSS custom properties use platform-prefixed names to avoid collisions:
  `--staticart-color-primary`, `--blogengine-color-primary`.
- Shared dependencies (e.g. both platforms need hybrids) are vendored once
  at the Clearstack level (`src/vendor/hybrids/`), not per-platform.

### Practical Limits

Multi-platform stacking is supported but not the common case. Most projects
use one platform. The architecture supports multiple platforms to avoid
painting into a corner, not because it's a recommended pattern.

---

## 8. Build Pipeline Integration

Platforms often provide build scripts (e.g. StatiCart's `build-products.js`).
These integrate with the child project's build pipeline.

### Script Ownership

| Script                      | Copied on    | Updated on | Owner                             |
| --------------------------- | ------------ | ---------- | --------------------------------- |
| `scripts/setup.js`          | init         | never      | Project (may customize)           |
| `scripts/vendor-deps.js`    | init         | never      | Project (adds platform vendor)    |
| `scripts/build-products.js` | init         | never      | Project (may customize)           |
| Platform-internal scripts   | never copied | n/a        | Platform (runs from node_modules) |

The child project's `setup.js` (run on `postinstall`) should vendor both
Clearstack dependencies and platform files:

```javascript
// scripts/setup.js
await import('./vendor-deps.js'); // hybrids → src/vendor/hybrids/
await import('./vendor-platform.js'); // staticart → src/vendor/staticart/
await import('./build-icons.js'); // lucide → icons.json
```

### CI/CD

The platform's GitHub Actions workflow template is copied on `init`. The
child project owns it and can customize. The platform documents what
environment variables and secrets are required.

---

## 9. Version Compatibility

### Clearstack ↔ Platform

The platform declares its required Clearstack version as a `peerDependency`
(e.g. `"@techninja/clearstack": ">=0.3.17"`).

### Platform ↔ Project

The child project pins the platform version in `dependencies` or
`devDependencies`. `npm update` + `clearstack update` brings in new
vendor files. The project's config, overrides, and custom components
are untouched.

### Breaking Changes

When a platform makes a breaking change (new required config key, renamed
component, changed store model shape):

1. Platform bumps major version
2. Platform's `CHANGELOG.md` documents migration steps
3. `clearstack update` warns if the installed platform version has a
   major bump since last update
4. `--force` is required to proceed with major version updates

---

## 10. Example

See `docs/app-spec/` for project-specific platform examples (e.g.
StatiCart package structure, child project layout, i18n layer mapping).

---

## Summary

| Concept              | Mechanism                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------ |
| Platform declaration | `clearstack.platform` in `package.json`                                                    |
| Component override   | Import map specificity (`#prefix/component` before `#prefix/`)                             |
| Style override       | CSS custom properties in project `tokens.css`                                              |
| Config override      | Project-owned config file, platform provides defaults                                      |
| i18n override        | 4-layer cascade: platform defaults → locale → project overrides → project locale overrides |
| Vendor sync          | `postinstall` + `clearstack update` copies platform source to `src/vendor/<prefix>/`       |
| Spec checks          | Clearstack checks compose automatically; vendor files excluded                             |
| Version management   | semver + `peerDependencies` + `clearstack update` warnings                                 |

### Design Principles

1. **Convention over configuration.** The import map prefix, vendor directory,
   and override cascade all follow predictable patterns.
2. **Ownership is explicit.** Every file belongs to exactly one layer.
   No ambiguity about who can edit what.
3. **Update without clobbering.** `clearstack update` never destroys
   project customizations. Vendor files are regenerable. Config is sacred.
4. **Override without forking.** Import maps, CSS custom properties, and
   i18n cascades let projects customize without modifying platform source.
5. **Spec checks compose.** A stacked project passes the same checks as
   a vanilla Clearstack project. No special configuration needed.
