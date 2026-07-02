# shaughv-tasks

Emmett Shaughnessy's standalone **task + workplace-memory** plugin for Claude Code and Codex.
It's the seven SHAUGHV `tasks-*` skills — grown from the five originally extracted from
[`shaughv-code`](https://github.com/RealEmmettS/shaughv-code) — a focused bundle so the task
system is installable on its own, in any agent.

`/tasks-start` stands up a self-contained `.tasks/` folder in any repo and opens a live,
SHAUGHV-branded board:

- **A Kanban task list** (`.tasks/TASKS.md`) — Backlog → To-Do → Active → Done, with stable
  task ids, prerequisites, owners, and UI-backed subtasks with optional per-subtask descriptions.
- **Milestones** (`.tasks/MILESTONES.md`) — dated, epic-scale groupings tasks roll up into with
  an `(ms #id)` tag; derived progress bars on the board's milestone rail, and a hard rule that a
  milestone can't close while a child task is open.
- **Per-task handoff files** (`.tasks/tasks/<id>.md`) — a TT;DR-led description, a plan, a
  **verification checklist** (default-on; every check must be passed or waived-with-a-record
  before the task can complete), and a timestamped activity log, so any agent can pick a task
  up cold.
- **Two-tier workplace memory** (`.tasks/CLAUDE.md` hot cache + `.tasks/memory/` deep store) —
  so the agent decodes your people, projects, acronyms, and shorthand like a colleague — plus a
  gitignored **`.tasks/secure/`** for secrets and private notes that must never be committed.
- **A live dashboard** — a zero-dependency Node board server with two-way sync, a milestone
  rail, a click-to-open task detail modal, a freshness indicator, and animated cards. It works
  fully offline, and multiple boards can run on one machine at once (one per repo, identity-
  verified ports).

It serves two audiences at once: the **agent**, which tracks what it must do, is doing, and has
done (plus durable repo learnings) across sessions and months; and the **operator**, who watches
and reorganizes the same board. Tasks and memory **persist across sessions** — run `/tasks-start`,
plan a bunch of work, come back days later, run `/tasks-start` again, and resume exactly where you
left off. Choose once whether `.tasks/` is **git-tracked** (shared with your team and other
agents — board included, so collaborators who clone get a working dashboard with zero installs)
or **kept local**; the choice is remembered in `.tasks/config.json` and never asked again.

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
| `tasks-start` | Stand up a self-contained `.tasks/` task + workplace-memory system (TASKS.md, MILESTONES.md, working memory, deep memory, `secure/`, `config.json`, and a SHAUGHV-branded board/list/memory `dashboard.html` with a vintage-cream / brutalist-dark theme toggle), ask once whether the board is git-tracked or local, launch the live board, teach the target repo's CLAUDE.md/AGENTS.md how to use the task system, and bootstrap memory from your real task list and connected tools. Idempotent — re-run it to relaunch the board and resume where you left off; it never re-asks a recorded choice. |
| `tasks-create` | The guided front door for creating work: decides milestone vs task vs subtask with you, links prerequisites and milestones, sets owners, and authors the default-on verification checklist. |
| `tasks-update` | Sync tasks from a connected tracker (Asana/Linear/Jira/GitHub Issues), triage overdue and stale items (including at-risk milestones), archive cleared milestone work so progress never regresses, and fill memory gaps; `--comprehensive` deep-scans chat/email/calendar/docs for missed todos and new memories. |
| `tasks-management` | Reference for the full contract — `.tasks/TASKS.md`, `.tasks/MILESTONES.md`, per-task and per-milestone detail files, the milestone → task → subtask hierarchy, verification checklists with waivers, completion gates, the read/write/complete verbs, multi-operator conventions, and how to surface overdue / due-today / at-risk items. |
| `tasks-memory` | The two-tier workplace-memory model (`.tasks/CLAUDE.md` hot cache + `.tasks/memory/` deep store) that lets the agent decode shorthand, nicknames, acronyms, and project codenames like a colleague — plus the secrets policy and the `secure/` private tier. |
| `tasks-boards` | Reference for multi-board machines: how agents find, identity-verify, and talk to the RIGHT board when several repos each run their own (a port is not an identity). |
| `tasks-remove` | Decommission the system and flatten it back into the repo — merge working memory into the root `CLAUDE.md`, move deep memory into a repo-level `memory/`, preserve open tasks and milestones, handle `secure/` explicitly (never promoted), then delete `.tasks/`. The inverse of `/tasks-start`. |

## Persistence across sessions

The task list **is** the continuity layer. The **Active** column shows what's in flight; each
task's `.tasks/tasks/<id>.md` carries a `## Status` ("exactly where to resume") and a timestamped
`## Activity` log; and `/tasks-start`, on resume, reads those and leads with "here's where we left
off." A fresh `/tasks-start` always scaffolds the memory tree and configuration up front, so a
persistent skeleton exists even before any interactive setup. Nothing lives in a database — it's
all human-readable, diffable markdown under `.tasks/`.

Small required steps belong in the dashboard's **Subtasks** field, not buried as plain text in a
task description. Those subtasks are stored as indented checkbox rows in `TASKS.md`, and can carry
their own indented description lines for agent handoff detail. Larger dependent work should be a
separate top-level task linked with `(needs #id)`.

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
    ├── tasks-create/
    ├── tasks-update/
    ├── tasks-management/
    ├── tasks-memory/
    ├── tasks-boards/
    └── tasks-remove/
```

Edit skills in place — there is no build step for the Claude Code surface. The **Codex** surface
is the one exception: its `plugins/shaughv-tasks/` package is generated from root by
`build-codex-plugin.ps1` and must be regenerated (not hand-edited) whenever root skills or the
Codex manifest change.

## Author

[Emmett Shaughnessy](https://emmetts.dev) · `hey@emmetts.dev` · [@RealEmmettS](https://github.com/RealEmmettS)
