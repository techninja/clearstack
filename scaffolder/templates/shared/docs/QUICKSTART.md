# Quickstart

Get a spec-compliant project running, develop against it, and keep it in sync as the spec evolves.

## Prerequisites

- Node.js ≥ 20
- npm ≥ 10

## 1. Scaffold a New Project

```bash
npx hybrids-spec init
```

The interactive prompt asks for:

| Prompt | Default | Notes |
|---|---|---|
| Project name | `my-app` | Creates a directory with this name |
| Description | `A hybrids-spec project` | Goes into package.json |
| Mode | — | **Fullstack**: Express + WebSocket + JSON DB + SSE. **Static**: localStorage only, no server |
| Port | `3000` | Fullstack only. Set in `.env` |
| Include examples? | Yes | Starter components demonstrating spec patterns |

This generates a complete project directory:

```
my-app/
├── .configs/          # eslint, prettier, jsconfig, web-test-runner
├── .github/           # CI workflow, PR + issue templates
├── docs/              # Spec docs (upstream-managed)
│   └── project/       # Your project-specific specs (never overwritten)
├── public/            # Static assets, index.html, import map
├── scripts/           # vendor-deps, build-icons, spec checker
├── src/
│   ├── components/    # atoms/, molecules/, organisms/, pages/
│   ├── store/         # Hybrids store models
│   ├── styles/        # Global CSS with native nesting
│   ├── router/        # Client-side routing
│   └── utils/         # Shared helpers
├── tests/             # Node + browser tests
├── data/              # JSON DB (fullstack only)
├── server.js          # Express server (fullstack only)
├── .env               # PORT, spec thresholds
└── package.json
```

## 2. Install and Run

```bash
cd my-app
npm install
```

`postinstall` automatically runs `vendor-deps.js` (copies hybrids to `public/vendor/`) and `build-icons.js` (extracts Lucide SVGs to `public/icons.json`).

### Fullstack mode

```bash
npm run dev            # node --watch server.js
# → http://localhost:3000
```

### Static mode

```bash
npx serve public       # or any static file server
```

## 3. Development Workflow

### Create a component

Every component is a plain ES module that exports a Hybrids descriptor. Place it in the appropriate atomic design tier:

```
src/components/atoms/       # buttons, icons, badges
src/components/molecules/   # form fields, cards
src/components/organisms/   # lists, editors, canvases
src/components/pages/       # route-level views
```

Register it in `src/components/index.js` and add a `<script>` or import map entry in `public/index.html` if needed.

### Key rules while coding

- **≤150 lines per `.js` / `.css` file.** Add `// SPLIT CANDIDATE:` at 120 lines. When you hit the limit, extract a module.
- **Light DOM by default.** No `shadowRoot`. Shared styles in `src/styles/` apply everywhere.
- **JSDoc for types.** `@typedef`, `@param`, `@returns` — validated by `tsc --checkJs`.
- **No build step.** Every file runs as-is in the browser via ES modules and import maps.

### Run checks during development

```bash
npm run lint:fix       # ESLint auto-fix
npm run format         # Prettier auto-format
npm run typecheck      # JSDoc type validation
npm test               # Node + browser tests
npm run spec           # Full interactive spec compliance check
```

Or run individual spec checks:

```bash
npm run spec:code      # Code files ≤150 lines
npm run spec:docs      # Doc files ≤500 lines
```

## 4. Project-Specific Specs

The `docs/project/` directory is yours. Upstream updates never touch it. Use it for:

- Entity schemas and relationships
- Project-specific patterns or conventions
- API documentation beyond the base spec
- Architecture decisions (ADRs)
- Deviations from the spec (with rationale)

See [docs/project/README.md](./project/README.md) for the full guide.

## 5. Update Spec Docs

When the spec evolves upstream, pull the latest docs into your project:

```bash
npx hybrids-spec update
```

This:
- Copies updated spec docs from the package into your `docs/` directory
- Skips `docs/project/` entirely — your project-specific specs are safe
- Writes a `.specversion` file so you can track which version you're on
- Prints which files changed so you can review with `git diff docs/`

Review the diff, adjust your code if needed, then commit.

## 6. Check Spec Compliance

Run the full compliance suite at any time:

```bash
npx hybrids-spec check
```

This runs from the scaffolder package itself (no local scripts needed). It checks:

1. **Code line counts** — all `.js` / `.css` files ≤150 lines
2. **Doc line counts** — all `.md` files ≤500 lines
3. **ESLint** — linting with the spec's config
4. **Prettier** — formatting with the spec's config
5. **JSDoc types** — `tsc --checkJs` against jsconfig

The same checks run in CI via the GitHub Actions workflow scaffolded into `.github/`.

### Configuring thresholds

Override defaults in `.env`:

```bash
SPEC_CODE_MAX_LINES=150
SPEC_DOCS_MAX_LINES=500
SPEC_CODE_EXTENSIONS=.js,.css
SPEC_DOCS_EXTENSIONS=.md
SPEC_IGNORE_DIRS=node_modules,public/vendor,.git,.configs
```

## 7. CI Pipeline

The scaffolded `.github/workflows/` runs all spec checks on every PR. A PR cannot merge unless all checks pass. The workflow runs:

```
npm run spec:code → npm run spec:docs → npm run lint → npm run format → npm run typecheck → npm test
```

## Summary

| Task | Command |
|---|---|
| Scaffold a project | `npx hybrids-spec init` |
| Install dependencies | `npm install` |
| Start dev server | `npm run dev` (fullstack) / `npx serve public` (static) |
| Lint + format | `npm run lint:fix && npm run format` |
| Type check | `npm run typecheck` |
| Run tests | `npm test` |
| Full spec check | `npm run spec` or `npx hybrids-spec check` |
| Update spec docs | `npx hybrids-spec update` |
| Review spec changes | `git diff docs/` |
