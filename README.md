# shaughv-tasks

Emmett Shaughnessy's standalone **task + workplace-memory** plugin for Claude Code and Codex.
It's the five SHAUGHV `tasks-*` skills — extracted from [`shaughv-code`](https://github.com/RealEmmettS/shaughv-code)
into their own focused bundle so the task system is installable on its own, in any agent.

`/tasks-start` stands up a self-contained `.tasks/` folder in any repo and opens a live,
SHAUGHV-branded board:

- **A Kanban task list** (`.tasks/TASKS.md`) — Backlog → To-Do → Active → Done, with stable
  task ids and prerequisites.
- **Per-task handoff files** (`.tasks/tasks/<id>.md`) — a TT;DR-led description, a plan, and a
  timestamped activity log, so any agent can pick a task up cold.
- **Two-tier workplace memory** (`.tasks/CLAUDE.md` hot cache + `.tasks/memory/` deep store) —
  so the agent decodes your people, projects, acronyms, and shorthand like a colleague.
- **A live dashboard** — a zero-dependency Node board server with two-way sync, a click-to-open
  task detail modal, a freshness indicator, and animated cards. It works fully offline.

It serves two audiences at once: the **agent**, which tracks what it must do, is doing, and has
done (plus durable repo learnings) across sessions and months; and the **operator**, who watches
and reorganizes the same board. Tasks and memory **persist across sessions** — run `/tasks-start`,
plan a bunch of work, come back days later, run `/tasks-start` again, and resume exactly where you
left off.

## Install

### Claude Code

```text
/plugin marketplace add RealEmmettS/shaughv-tasks
/plugin install shaughv-tasks@shaughv-tasks
```

Then run `/tasks-start` in any repo. The skills auto-load whenever their description matches.

### Codex

```bash
codex plugin marketplace add RealEmmettS/shaughv-tasks
codex plugin add shaughv-tasks@shaughv-tasks
```

Codex installs a marketplace plugin by snapshotting a self-contained plugin **subdirectory** —
it can't consume this repo's flat root (which stays flat for Claude Code's install). The repo
therefore carries a tracked, generated package at `plugins/shaughv-tasks/`, built from repo root
(`skills/`, `.codex-plugin/plugin.json`) by `build-codex-plugin.ps1`, and
`.agents/plugins/marketplace.json` points Codex at it. This bundle is **skills-only** — it ships
no MCP servers (the board is a local Node HTTP server the skill launches, not an MCP server).
**Never hand-edit `plugins/shaughv-tasks/`** — it's generated; edit root content and regenerate
with `pwsh ./build-codex-plugin.ps1`.

### Any other agent — skills-only with `npx skills`

For Cursor, OpenCode, Gemini CLI, and ~50 others — or if you only want the skills:

```bash
npx skills add RealEmmettS/shaughv-tasks
```

Defaults to a project install at `.claude/skills/` (or your agent's equivalent — the CLI
auto-detects). Add `-g` for a global install. Update later with `npx skills update`.

## Update

```text
# Claude Code
/plugin marketplace update shaughv-tasks
/reload-plugins
```

```bash
# Codex
codex plugin marketplace upgrade shaughv-tasks
codex plugin add shaughv-tasks@shaughv-tasks
```

To develop against a local checkout instead of the published marketplace:

```bash
claude --plugin-dir C:/Users/hey/git/shaughv-tasks
```

## Skills bundled

| Skill | Purpose |
|---|---|
| `tasks-start` | Stand up a self-contained `.tasks/` task + workplace-memory system (TASKS.md, working memory, deep memory, and a SHAUGHV-branded board/list/memory `dashboard.html` with a vintage-cream / brutalist-dark theme toggle), launch the live board, and bootstrap memory from your real task list and connected tools. Idempotent — re-run it to relaunch the board and resume where you left off. |
| `tasks-update` | Sync tasks from a connected tracker (Asana/Linear/Jira/GitHub Issues), triage overdue and stale items, and fill memory gaps; `--comprehensive` deep-scans chat/email/calendar/docs for missed todos and new memories. |
| `tasks-management` | Reference for the `.tasks/TASKS.md` contract and per-task `.tasks/tasks/<id>.md` detail files — the markdown task format, the read/write/complete verbs, the self-contained-handoff + activity-log discipline, and how to surface overdue / due-today / priority items. |
| `tasks-memory` | The two-tier workplace-memory model (`.tasks/CLAUDE.md` hot cache + `.tasks/memory/` deep store) that lets the agent decode shorthand, nicknames, acronyms, and project codenames like a colleague. |
| `tasks-remove` | Decommission the system and flatten it back into the repo — merge working memory into the root `CLAUDE.md`, move deep memory into a repo-level `memory/`, preserve open tasks, then delete `.tasks/`. The inverse of `/tasks-start`. |

## Persistence across sessions

The task list **is** the continuity layer. The **Active** column shows what's in flight; each
task's `.tasks/tasks/<id>.md` carries a `## Status` ("exactly where to resume") and a timestamped
`## Activity` log; and `/tasks-start`, on resume, reads those and leads with "here's where we left
off." A fresh `/tasks-start` always scaffolds the memory tree and configuration up front, so a
persistent skeleton exists even before any interactive setup. Nothing lives in a database — it's
all human-readable, diffable markdown under `.tasks/`.

## A note on companion skills

A few of these skills softly reference skills from the companion `shaughv-code` plugin (`ttdr`,
`personal-productivity`, `iterative-plan`, `git-workflow`). Each reference **degrades gracefully**
— if that plugin isn't installed, the skill falls back to inline behavior, so `shaughv-tasks`
stands fully on its own.

## Repo layout

```
shaughv-tasks/
├── .agents/
│   └── plugins/
│       └── marketplace.json # Codex marketplace entry (points at plugins/shaughv-tasks/)
├── .claude-plugin/
│   ├── plugin.json          # plugin manifest
│   └── marketplace.json     # marketplace entry (single-plugin marketplace)
├── .codex-plugin/
│   └── plugin.json          # Codex plugin manifest (skills-only; no MCP)
├── build-codex-plugin.ps1   # regenerates plugins/shaughv-tasks/ from root
├── plugins/
│   └── shaughv-tasks/       # GENERATED Codex package — do not hand-edit
│       ├── .codex-plugin/plugin.json   # copy of root manifest
│       └── skills/                     # copy of root skills/
└── skills/
    ├── tasks-start/         # the only skill with assets (board server, dashboard, vendor/)
    ├── tasks-update/
    ├── tasks-management/
    ├── tasks-memory/
    └── tasks-remove/
```

Edit skills in place — there is no build step for the Claude Code surface. The **Codex** surface
is the one exception: its `plugins/shaughv-tasks/` package is generated from root by
`build-codex-plugin.ps1` and must be regenerated (not hand-edited) whenever root skills or the
Codex manifest change.

## Author

[Emmett Shaughnessy](https://emmetts.dev) · `hey@emmetts.dev` · [@RealEmmettS](https://github.com/RealEmmettS)
