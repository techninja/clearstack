# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.3.23] - 2026-04-13

- Platform sync upgrades


- Platform update syncs new scripts and API files (not just vendor + docs)
- Fix copySkipExisting to recurse into existing directories for nested new files
- Fix prettier violation in scaffolded release.js template

## [0.3.22] - 2026-04-12

- Deploy with own version

## [0.3.21] - 2026-04-11

- Fix command

## [0.3.20] - 2026-04-11

- Add release helpers

## [0.3.19] - 2026-04-11

- Way too much from 3 project learnings - Project stacking - Larger limits for test files - No swallowed silent errors -
- Initial work toward platform stacking
- More Staticart findings

## [0.3.17] - 2026-04-08

- Phase 3 build log for Staticart
- Staticart learnings improvement for importmaps in tests

## [0.3.16] - 2026-04-07

- Fix colon vs spaces, better spec checks
- No pnpm here thx

## [0.3.15] - 2026-04-07

- Unify spec checker, add branding 💙
- release: v0.3.14
- Add findings from StatiCart
- release: v0.3.13

## [0.3.14] - 2026-04-07

- Add findings from StatiCart

## [0.3.13] - 2026-04-07

- Spec linting
- Allow passing --static for serverless builds

## [0.3.12] - 2026-04-07

- Fix ordering of spec check to account for auto lint fixes Also add convention around splitting vs compressing for big files
- Update conventions to prevent filtering spec checks

## [0.3.11] - 2026-04-06

- Did I forget to run my own spec check? SHHHHHHHHHH

## [0.3.10] - 2026-04-06

- Fix upgrade templates
- Fix argument bugs with scaffolded repos

## [0.3.9] - 2026-04-06

- Better error handling
- Rework spec check for better running options
- The dangers of backUrl!
- Another rendering gotcha
- Another little hybrids gotcha
- Add gotcha found on Asili

## [0.3.8] - 2026-04-06

- Move to importmap preferred for appropriate code

## [0.3.7] - 2026-04-05

- Add detection to utilize correct package manager in check

## [0.3.6] - 2026-04-03

- Unify test runner

## [0.3.5] - 2026-04-03

- Update lock

## [0.3.4] - 2026-04-03

- More cleanup, better tests
- Extend linting, add dead import detection, npm audit
- Flatten static structure for simple serving Remove tests from spec check

## [0.3.3] - 2026-04-03

- Missed cleanup from scaffold fork

## [0.3.2] - 2026-04-03

- Job level node 24

## [0.3.1] - 2026-04-03

- I'll believe it when I see it

## [0.3.0] - 2026-04-03

- Initial release

## [0.2.21] - 2026-04-03

- Logo and vscode colors

## [0.2.20] - 2026-04-03

- Move to basic express static for simplicity

## [0.2.19] - 2026-04-03

- Unify spec util

## [0.2.18] - 2026-04-03

- Doc fixes, package lock

## [0.2.17] - 2026-04-02

- Add Style and Markdown linting, templates, fixes
- Refactor for scaffolding tests

## [0.2.16] - 2026-04-02

- Trusting some random gist

## [0.2.15] - 2026-04-02

- Bigger bonk? :boom:

## [0.2.14] - 2026-04-02

- Bonk! :hammer:

## [0.2.13] - 2026-04-02

- This one might shine a light
- Update for non-deprecated Node 24 action runners

## [0.2.12] - 2026-04-02

- Publishing to NPM used to be easy...

## [0.2.11] - 2026-04-02

- Grasping at straws in the dark

## [0.2.10] - 2026-04-02

- Fix CI for spec test
- Release fix maybe

## [0.2.9] - 2026-04-02

- Try to fix the publish!
- Make it public
- Fix bin location

## [0.2.8] - 2026-04-02

- Simplify test and setup entries
- Fix static hosting, add tests

## [0.2.7] - 2026-04-02

- Refactor for node script condensing and simplification
- Simplify spec run to summary with error details
- Ignore warnings in node modules

## [0.2.6] - 2026-04-01

- Missing type defs and immediate linting issue

## [0.2.5] - 2026-04-01

- Update for better packaging, build gitignore

## [0.2.4] - 2026-04-01

- No postinstall please

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
