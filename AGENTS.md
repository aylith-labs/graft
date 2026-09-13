# graft (Aylith fork) — Claude Code guidance

<!-- aylith-handbook:start -->
> **📖 Aylith handbook (authoritative).** This repo is part of the `aylith-labs` lab. Before any
> cross-repo, catalog, design-system, CI/runner, or data-flow work you **must** consult the org
> handbook — the single source of truth for these conventions:
> https://github.com/aylith-labs/aylith-handbook (locally `../aylith-handbook/`, skill `aylith-labs`).
<!-- aylith-handbook:end -->

## Project Overview

The Aylith Labs fork of trailhq/Graft, published as `@aylith/graft` (binary `aylith-graft`). It
builds a code graph with tree-sitter and answers retrieval questions (`ask`, `grep`, `callers`,
`skeleton`, `map`, `blast`) from the CLI, the MCP server or the library API. TypeScript on
Node ≥ 20, npm. [FORK.md](FORK.md) lists what was removed from upstream and why.

## Commands

- `npm ci` — install (compiles the tree-sitter native grammars)
- `npx tsc -p tsconfig.json --noEmit` — typecheck
- `npm test` — the full suite (`node --import tsx --test`, via `scripts/run-tests.mjs`)
- `npm run build` — compile `dist/` and the viz viewer
- `node scripts/fork-check.mjs` — fails if anything FORK.md removed has come back

## Architecture

- `src/graph/` — walk, per-language extraction (native and WASM tree-sitter), edge resolution, the
  wiring graph and the card writer
- `src/ask/`, `src/search/` — ranked retrieval (lexical plus personalized PageRank) and grep grouped
  by enclosing symbol
- `src/mcp/` — the stdio MCP server and its tools
- `src/blast/`, `src/viz/`, `viewer/` — diff blast radius and the graph viewer
- `src/ai/` — the optional `build --deep` LLM pass
- `src/cli.ts` — the commander entry point; `src/index.ts` — the library exports

## Conventions

- Upstream is merged, never rebased: `git fetch upstream && git merge upstream/main`. A
  modify/delete conflict on a path FORK.md removed resolves as deleted.
- Nothing added here may reach the network, run at install time, or write into the indexed
  repository when the graph dir is outside it; `scripts/fork-check.mjs` enforces the removals.
- Keep fork edits small and local, so an upstream merge conflicts in one place.
