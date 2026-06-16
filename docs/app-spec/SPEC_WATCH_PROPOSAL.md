# Spec Watch Dashboard Mode

## Summary

A continuous-running spec compliance dashboard for development that
displays real-time status and produces LLM-friendly output on violations.

## Command

```bash
clearstack check --watch     # or: npm run spec --watch
```

## Display

Compact terminal dashboard, updates on file changes:

```
┌─ Clearstack Spec Watch ─────────────────────────┐
│  ✅ code    67 files    all ≤150 lines           │
│  ✅ lint    44 files    0 errors                 │
│  ✅ types   44 files    0 errors                 │
│  ✅ docs    12 files    all ≤500 lines           │
│                                                  │
│  watching src/ scripts/ docs/                    │
│  last check: 2s ago                              │
└──────────────────────────────────────────────────┘
```

On violation:

```
┌─ Clearstack Spec Watch ─────────────────────────┐
│  ❌ code    1 violation                          │
│  ✅ lint    44 files                             │
│  ✅ types   44 files                             │
│  ✅ docs    12 files                             │
│                                                  │
│  ─── Copy below into your LLM session ───       │
│                                                  │
│  src/pages/media/media-detail-view.js            │
│  167 lines (max 150, +17 over)                   │
│  Split candidates:                               │
│    L15-42: data loading → utils/mediaLoader.js   │
│    L58-89: carousel render → utils/carousel.js   │
│    L140-167: related grid → utils/related.js     │
│                                                  │
└──────────────────────────────────────────────────┘
```

## Key Design Decisions

- **LLM-friendly output**: The violation block is designed to be
  copy-pasted into a chat session. It contains file path, line numbers,
  exact overage, and actionable split suggestions.

- **Split candidate detection**: Reads `// SPLIT CANDIDATE:` comments
  from the file. If none exist, uses heuristics (comment headers,
  export boundaries, function declarations) to suggest seams.

- **Debounced**: Doesn't re-check on every keystroke. Waits 500ms after
  last file change, then runs only the relevant check (code check for
  .js/.css changes, lint for .js changes, etc).

- **No blocking**: Never prevents saves or interrupts workflow. It's
  purely informational — a dashboard you glance at.

## Implementation Notes

- Use `fs.watch` or chokidar for file watching
- Re-run only affected checks (file changed → which check cares?)
- Terminal UI via basic ANSI escape codes (no heavy TUI library)
- Exit with Ctrl+C, summary of current state on exit

## Integration with IDE

If the user's IDE has a terminal panel, this runs there. The
"copy below" block is the key UX innovation — it bridges the gap
between the spec checker (which knows the problem) and the LLM
(which can fix it but needs context).
