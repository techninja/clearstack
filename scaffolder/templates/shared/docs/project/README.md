# Project-Specific Specifications

> This directory is yours. The upstream spec will never touch it.

## What Goes Here

Files in `docs/` (the parent directory) are managed by the upstream
`hybrids-spec` package. Running `npx hybrids-spec update` may overwrite
them with newer versions. **This `docs/project/` directory is excluded
from upstream updates** — it's where your project's own conventions,
domain-specific patterns, and architectural decisions live.

## What to Document

| Document | Example content |
|---|---|
| `ENTITIES.md` | Your domain entities, their relationships, field descriptions |
| `PATTERNS.md` | Project-specific component patterns, naming overrides |
| `API.md` | Custom API endpoints beyond the generic CRUD |
| `DEPLOYMENT.md` | How this project is built, deployed, and monitored |
| `DECISIONS.md` | Architecture Decision Records — why you chose X over Y |
| `OVERRIDES.md` | Where your project intentionally deviates from the base spec and why |

## Rules

- **One topic per file.** Same as the base spec — split when it grows.
- **Link to the base spec** when extending it, not duplicating it.
- **Document deviations explicitly.** If you override a base spec convention,
  say which one and why. Future you (or your LLM) will thank you.
- **Keep it current.** If a pattern changes, update the doc in the same PR.

## Example: Overriding a Convention

```markdown
# Overrides

## File size limit: 200 lines (base spec: 150)

Our data visualization components require more inline SVG math.
Rather than splitting every function, we allow 200 lines for files
in `src/components/organisms/chart-*/**`.

Updated `.env`:
SPEC_CODE_MAX_LINES=200
```

## How Updates Work

When you run `npx hybrids-spec update`:

1. Files in `docs/*.md` are compared against the upstream package
2. Changed files are overwritten — review with `git diff docs/`
3. **`docs/project/` is never touched** — your files are safe
4. The `docs/.specversion` file tracks which upstream version you synced from

Your project-specific docs and the base spec coexist. The base spec
provides the foundation; this directory is where you build on top of it.
