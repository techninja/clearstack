# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.2.3] - 2026-04-01

- Let's play guess how many times I have to build this...


## [0.2.2] - 2026-04-01

- Publish with provenance


## [0.2.1] - 2026-04-01

- Fix readme name and generation


## [0.2.0] - 2026-04-01

- Merge pull request #2 from techninja/scaffolder
- Linting
- Release helper, let's goooo
- Kick dotenv to the curb
- Naughty zoot!
- Type cleanup, config adjustments
- Hello Clearstack! Refactor for rename, better scaffolding, install as a dep!
- WIP scaffolder first draft
- Merge pull request #1 from techninja/whiteboard
- Mobile fix for touch drag and select
- Add initial GH templates
- Add base changelog
- Whiteboard feature
- Link to build log
- Add websockets, icons
- Document build log after first step completion
- Gate for PR and main build on spec
- Cleanup root refactor and license fix
- Initial base commit with self proving spec
- Initial commit


### Added
- Collaborative SVG whiteboard per project with real-time WebSocket sync
- Drawing tools: pen, rectangle, circle, line, text
- 16 Lucide-powered diagram shape stamps (cloud, database, server, etc.)
- Object selection with move, resize, rotate, and delete
- Touch support: single-finger draw/select, two-finger pan
- Responsive resize handles (2x on touch devices)
- Text tool with click-to-edit existing text
- Lucide icon integration via `scripts/build-icons.js` (37 icons)
- `app-icon` component loads icons async from generated `icons.json`
- Canvas toolbar with Lucide icons for all tools and shapes picker
- `docs/BUILD_LOG.md` documenting the LLM-human build process
- Session retrospective practice in `docs/CONVENTIONS.md`
- Soft warning convention at 120 lines with `// SPLIT CANDIDATE:` markers
- SVG innerHTML and coordinate transform patterns in `docs/COMPONENT_PATTERNS.md`
- 16 new tests for canvas transforms, messages, and component rendering

### Changed
- Project detail page: whiteboard front and center, condensed header row
- `app-icon` rewritten to load from Lucide-generated `icons.json`
- `page-layout` converted from component to template function (fixes host context)
- Selection handles use `getBBox()` with `applyShapeTransform` for accurate bounds
- Server sort uses numeric comparison for number fields
- DB module exposes `reload()` for test isolation

### Fixed
- Event handlers in content template properties now resolve correct host
- `store.clear([Model])` used for list stores (was clearing singular only)
- `store.ready(item)` guard on list items prevents pending-state crashes
- SSE events debounced per entity type to prevent cascade on batch operations
- localStorage connector returns `{}` instead of `undefined` on first load
- Form validation attributes no longer render as `"undefined"` strings
- SPA fallback serves `index.html` for frontend routes
- Server port conflict shows clear error message with suggested fix

## [1.0.0] - 2025-03-30

### Added
- Initial specification: 8 documents covering frontend, backend, testing
- Project/task tracker proof-of-concept
- Hybrids.js web components with light DOM, no build tools
- Express server with generic entity CRUD router
- JSON Schema via OPTIONS for schema-driven forms
- Server-Sent Events for real-time entity sync
- JSON file-backed database with seed data
- Dark mode via CSS custom property overrides
- Drag-to-reorder tasks with visual gap indicator
- Spec compliance checker: `npm run spec` (7 automated checks)
- ESLint + Prettier + JSDoc type checking via `tsc --checkJs`
- GitHub Actions CI pipeline
- 90 tests (node + browser)
