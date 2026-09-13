# What this fork changes

`aylith-labs/graft` is [trailhq/Graft](https://github.com/trailhq/Graft) with every part that
reaches outside the machine, or writes into a repository or home directory it was not asked to,
removed. It is published as `@aylith/graft`, binary `aylith-graft`, and is the code-intelligence
engine behind [whittle](https://github.com/aylith-labs/whittle).

## Kept

The graph builder (`src/graph/`, tree-sitter extraction and edge resolution), retrieval and ranking
(`src/ask/`, `src/search/`), `blast`, `viz`, the MCP server and its tools (`src/mcp/`), the optional
`build --deep` LLM pass (`src/ai/`, off unless a key is configured), and the public library API
(`src/index.ts`).

CLI commands: `build`, `ask`, `grep`, `callers`, `skeleton`, `map`, `blast`, `check`, `mcp`, `viz`.

## Removed

| Path | What it did |
|---|---|
| `src/telemetry/`, `TELEMETRY.md`, `scripts/postinstall.mjs`, `scripts/stamp-telemetry-key.mjs` | anonymous usage events sent to a hosted collector, including one from `npm install` |
| `src/brain/` | uploading repository history and docs to a hosted rules service, and pulling rules back into `ask` output |
| `src/app/`, `Dockerfile`, `.dockerignore`, `deploy/`, `docs/github-app.md` | a GitHub App review server |
| `src/hosts/`, `src/claude/`, `src/cli-picker.ts`, `src/cli-epilogue.ts`, `.claude/` | `init` and `uninstall`: hooks, statusline, skills, MCP entries and instruction files written into repositories, `~/.claude`, `~/.codex` and `~/.gemini` |
| `src/upkeep.ts`, `src/upkeep-run.ts`, `scripts/tally-audit.mjs` | re-running `init` on every session start after an upgrade, and the `npm view` upgrade check |
| `src/context/price.ts` | pricing the savings estimate in dollars |
| `version`, `upgrade`, `telemetry`, `stats`, `init`, `uninstall`, `brain` commands | the command-line surface of the above |
| `.github/workflows/{blast,blast-cache,blast-pages,scorecard}.yml` | upstream's own PR bot and scorecard publishing |
| `dotenv` | loading any `.env` in the working directory into every process |

## Changed

- **Savings footer off by default.** Retrieval output no longer starts with `[graft] tokens saved ≈ N`
  or asks the agent to report a running total. `GRAFT_FORK_SAVINGS_FOOTER=1` restores the footer,
  without the instruction to the agent.
- **MCP instructions stop steering.** The server no longer tells the agent to prefer its tools over
  grep and read. `GRAFT_FORK_MCP_STEERING=1` restores that sentence.
- **A graph outside the repository writes nothing into it.** With `GRAFT_DIR` (or `--dir`, which the
  CLI exports into `GRAFT_DIR`) pointing outside the repository, the persisted build config lives in
  the graph directory and `.gitignore` is left alone; `.gitignore` and `.ignore` were already skipped.
- **Package**: name `@aylith/graft`, binary `aylith-graft`, no `postinstall`, `prepare` only builds.

`scripts/fork-check.mjs` enforces the removals in CI, so an upstream merge that brings any of them back
fails the build.

## Syncing with upstream

```bash
git fetch upstream
git merge upstream/main
```

A modify/delete conflict on a removed path resolves as deleted (`git rm <path>`). Then run
`node scripts/fork-check.mjs`, `npx tsc -p tsconfig.json --noEmit` and `npm test`. Merge, never
rebase, so the fork's history stays a record of what was taken from upstream and when.
