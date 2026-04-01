# Contributing

Thanks for your interest in hybrids-spec! This project is both a specification
and its working proof — contributions to either are welcome.

## Before You Start

1. Read the [README](./README.md) for project overview
2. Skim the spec docs in `docs/` — especially [CONVENTIONS.md](./docs/CONVENTIONS.md)
3. Run `npm run spec` to see the compliance checker in action

## Development Setup

```bash
git clone <repo-url>
cd hybrids-spec
npm install        # installs deps, vendors hybrids, builds icons
npm run dev        # starts server with --watch and .env loading
npm run spec       # interactive spec compliance checker
```

## The Rules

These are enforced by CI. Your PR will not merge if any fail.

- **≤150 lines per code file.** Add `// SPLIT CANDIDATE:` comments at ~120 lines.
- **≤500 lines per doc file.**
- **ESLint clean.** Semicolons, 2-space indent, `prefer-const`, `eqeqeq`.
- **Prettier formatted.** Run `npm run format` before committing.
- **JSDoc types pass.** Run `npm run typecheck`. Zero errors.
- **All tests pass.** `npm test` runs both node and browser tests.

## Making Changes

### Code changes

1. Create a branch from `main`
2. Make your changes — keep files under 150 lines
3. Add/update tests for anything that could break
4. Run `npm run spec all` — all 7 checks must pass
5. Open a PR with a clear description of what and why

### Spec changes

The spec is a living document. If your implementation reveals a gap:

1. Fix the code
2. Update the relevant spec doc in `docs/`
3. Note the discovery in `docs/BUILD_LOG.md` if it's significant

### Adding a new component

```
src/components/{tier}/{tag-name}/
├── {tag-name}.js    # Component definition
├── {tag-name}.css   # Scoped styles (tag-name nesting)
├── {tag-name}.test.js  # Browser tests
└── index.js         # Re-export
```

Then add the CSS import to `src/styles/components.css`.

### Adding a new entity

1. Add JSON Schema + layout to `src/api/schemas.js`
2. Add seed data to `data/seed.json`
3. Create a store model in `src/store/`
4. The generic CRUD router handles the rest

### Adding a new icon

Add the Lucide icon name mapping to `scripts/build-icons.js` and run
`npm run postinstall`.

## Session Retrospective

After each implementation session, ask yourself:

1. What patterns did I discover?
2. What broke that I didn't expect?
3. What tests would catch the bugs I found?
4. Did any files grow past 120 lines?
5. Does the spec need correction?

## Code of Conduct

Be kind, be constructive, be specific. This project was built through
collaborative conversation — contributions should continue that spirit.
