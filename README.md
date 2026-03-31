# hybrids-spec

A no-build web component framework specification — and its working proof — built entirely through LLM-human collaboration.

## Why This Exists

Modern frontend tooling optimizes for machines: bundlers, transpilers, tree-shakers. The result is code that no human (or LLM) can read as-written in the browser. This project asks: **what if we optimized for comprehension instead?**

The core bet: if every file is small, explicit, and runs exactly as authored — with no build step between source and browser — then both humans and LLMs can reason about, generate, and maintain the codebase with dramatically less friction.

This entire repository — the specification, the file structure, every component, the server, the tests, and this README — was authored through iterative conversation between a human and an LLM. The spec was written first, then proven through implementation, then corrected where the implementation revealed gaps. The spec enforces itself: `npm run spec` checks every file against its own rules.

## Quick Start

```bash
npm install
npm start         # http://localhost:3000
npm test          # node + browser tests
npm run spec      # interactive spec compliance checker
```

## What's In The Box

A project/task tracker that exercises every pattern in the spec: API-backed entities, localStorage-only state, realtime sync via SSE, schema-driven endpoints, and a full atomic design component hierarchy — all served as raw ES modules with zero build tools.

## Specification

| Document | What It Covers |
|---|---|
| [FRONTEND_IMPLEMENTATION_RULES.md](./docs/FRONTEND_IMPLEMENTATION_RULES.md) | Philosophy, framework choice, project structure, atomic design |
| [COMPONENT_PATTERNS.md](./docs/COMPONENT_PATTERNS.md) | Authoring, light DOM, styling, layout engine, JSDoc typing |
| [STATE_AND_ROUTING.md](./docs/STATE_AND_ROUTING.md) | Store, routing, unified app state, realtime SSE sync |
| [CONVENTIONS.md](./docs/CONVENTIONS.md) | Naming rules, anti-patterns |
| [SERVER_AND_DEPS.md](./docs/SERVER_AND_DEPS.md) | Express server, import maps, vendor dependency loading |
| [BACKEND_API_SPEC.md](./docs/BACKEND_API_SPEC.md) | REST CRUD, JSON Schema via HEAD, entity management |
| [TESTING.md](./docs/TESTING.md) | Testing philosophy, tools, patterns, phase checkpoints |

## Rules That Matter

- **No build tools.** ES modules served directly to the browser.
- **≤150 lines per code file.** When it grows, it splits.
- **Light DOM by default.** Shared styles just work.
- **JSDoc over TypeScript.** Types without a compile step — validated by `tsc --checkJs`.
- **Test at the boundary.** Each phase passes before the next begins.
- **The spec checks itself.** `npm run spec:code` and `npm run spec:docs`.
- **Lint and format.** ESLint + Prettier, semicolons, 2-space indent.

## Scripts

```bash
npm start           # Start server
npm run dev         # Start with --watch
npm test            # Node + browser tests
npm run lint        # ESLint check
npm run lint:fix    # ESLint auto-fix
npm run format      # Prettier auto-format
npm run typecheck   # JSDoc type validation via tsc
npm run spec        # Interactive spec compliance checker
npm run spec:code   # Check code files ≤150 lines
npm run spec:docs   # Check doc files ≤500 lines
```

## License

MIT
