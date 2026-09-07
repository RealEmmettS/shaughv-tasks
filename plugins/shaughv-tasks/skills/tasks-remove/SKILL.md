---
name: tasks-remove
description: >
  Decommission the tasks-* system in a repo and flatten its useful parts back into the
  repository itself. Use whenever the user says /tasks-remove, "remove the task system", "tear
  down tasks", "uninstall the task system", "flatten my tasks into the repo", "promote my
  memory", "I'm done with the dashboard", or otherwise wants the `.tasks/` scaffolding gone
  with its knowledge preserved. Promotes `.tasks/CLAUDE.md` working memory to `memory/workplace.md` with
  pointers from both hosts' effective root instructions, moves `.tasks/memory/` into a repo-level `memory/`, preserves open obligations
  and explicitly dispositions the remaining Backlog, then deletes `.tasks/` (dashboard
  included). Destructive — always confirm and show the migration plan first. The inverse of
  /tasks-start.
argument-hint: "[--keep-tasks] [--dry-run]"
---

# /tasks-remove

Take down the `.tasks/` system **without losing what it learned.** The working memory and
deep memory get promoted into the repo's `memory/` with pointers from both hosts' root instructions so the repo keeps the
context permanently; then `.tasks/` is deleted. This is the inverse of `/tasks-start`.

This is **destructive** (it deletes a folder). Always show the migration plan and get an
explicit "yes" before deleting anything. `--dry-run` shows the plan and stops.

## 1. Confirm the system exists

If there's no `.tasks/` in the current working directory, say so and stop — nothing to
remove.

Read everything first: `.tasks/CLAUDE.md`, `.tasks/memory/**`, `.tasks/TASKS.md`,
`.tasks/MILESTONES.md` (+ `.tasks/milestones/`), `.tasks/config.json`, a listing of
`.tasks/secure/` (names only — don't read secret contents), and — for a complete
uninstall — **`.tasks/.install-manifest.json`** (written by `/tasks-start`'s
installer). The manifest is the source of truth for everything provisioned: the vendored
display assets, any npm installs, and crucially any **out-of-tree global changes** (e.g. a
Node runtime installed because the machine didn't have one). If it's missing or unparseable,
fall back to the legacy marker-only teardown (hooks + `.tasks/` deletion, no global reversal).

## 2. Present the migration plan

Show the user exactly what will happen before touching anything:

```
/tasks-remove plan for <repo>:

  board server          →  stopped (node .tasks/board-server.mjs stop)
  native host settings →  only identified board hooks removed; other settings kept
  .tasks/CLAUDE.md      →  merge into ./memory/workplace.md; root host instructions point here
  .tasks/memory/        →  merge into ./memory/    (glossary.md, people/, projects/, context/)
  .tasks/TASKS.md       →  3 Active/To-Do + 1 evidence-debt Backlog → ## Open threads
                           2 other Backlog items → PRESERVE or DISCARD (your choice); Completed dropped
  .tasks/MILESTONES.md  →  1 open milestone → ## Open threads (grouped with its open tasks)
  .tasks/secure/        →  NOT promoted — you'll choose: delete or relocate (never folded into CLAUDE.md)
  .tasks/vendor/, config.json, board-config.js, .board-version.json, .install-manifest.json, milestones/, board-server.mjs, dashboard.html → deleted with .tasks/
  .tasks/               →  deleted after migration
  global Node install   →  OFFERED for reversal (default: KEEP) — only if the installer added one
```

Surface the **global-changes line only when the manifest actually lists one** (`global[]` with
`wasPreexisting:false` and `succeeded:true`). Quote the exact reverse command and its risk in
step 6 — never auto-run it.

```
Proceed? (or /tasks-remove --keep-tasks to leave a TASKS.md at the repo root)
```

Wait for confirmation. If `--dry-run`, stop here.

## 3. Promote working memory into shared repo memory

Merge .tasks/CLAUDE.md into memory/workplace.md, preserving existing facts and surfacing
conflicts. Strip only the bootstrap marker. Preserve the people/terms/projects/preferences
tables. If the repo has an established shared memory location, use it instead.

Update only the task-system section of the effective Codex root instructions
(AGENTS.override.md if present, otherwise AGENTS.md) and root CLAUDE.md with an explicit
pointer to the promoted document. Both hosts must be able to find the same context after
teardown. Preserve unrelated instructions. Do not create competing full copies.

## 4. Promote deep memory → repo `memory/`

Move `.tasks/memory/` into a repo-level `memory/` directory:

- **If `./memory/` doesn't exist:** move the whole tree (`glossary.md`, `people/`,
  `projects/`, `context/`) up to `./memory/`.
- **If it exists:** merge file-by-file. For `glossary.md`, append new rows and de-dupe. For
  `people/` and `projects/`, copy in files that don't exist; for collisions, merge the two
  files (union of sections) rather than overwriting — and tell the user which ones you
  merged.
- Keep kebab-case filenames; fix any that drifted (per Emmett's naming conventions).

If the repo has a different established memory convention (e.g. `.claude/memory/` or a
repo-level memory skill), target that instead — match the repo, don't impose `memory/`.

## 5. Handle open tasks

Tasks aren't "memory", so by default they don't survive teardown — but don't silently drop
open work:

- **Default:** preserve each remaining **Active** and **To-Do** item as a compact typed entry
  under `## Open threads` in `memory/workplace.md` (or a linked TODO artifact): current
  result/status; verified state and exact evidence pointers; unresolved check, contradiction, or
  blocker; failed-route signature/re-entry condition that prevents blind repetition; and exact
  next bounded action. Do not migrate the transcript or full attempt history.
- **Backlog requires an explicit disposition.** Before showing the destructive plan, inventory
  every unchecked Backlog item and its detail file. Automatically preserve any item that records
  deferred evidence debt, an unresolved acceptance obligation, or an open dependency/child of a
  preserved task or milestone. List the remaining Backlog titles/count in the plan and ask once
  whether to preserve them as compact open threads or discard them. No open Backlog item
  disappears under the generic word “archive.” Completed history may be dropped unless requested.
- **Open milestones get the same treatment**, grouped: an `## Open threads` entry per
  still-open milestone — `Milestone: Phoenix GA (3/7 tasks done, target 2026-08-01)` — with
  its still-open child tasks nested beneath it, so the grouping survives as prose.
- **`--keep-tasks`:** instead, move `.tasks/TASKS.md` (and `.tasks/MILESTONES.md`) to the
  repo root and keep the `tasks/` and `milestones/` detail dirs alongside them, tracked.

## 6. Stop the board, remove the hooks, delete `.tasks/`

Before deleting, tear down what `/tasks-start` set up **outside** `.tasks/`:

- **Stop the live server:** run `node .tasks/board-server.mjs stop` (kills the server via its
  recorded PID and clears its state files). Harmless if it isn't running.
- **Remove the board-maintenance hooks:** follow the ownership rules in
  [host setup](../tasks-start/references/hosts.md). Inspect both Claude settings files,
  the recorded Codex source, .codex/hooks.json, and inline Codex hooks if present.
  Remove only saved board commands, the generated shaughv-tasks-board-v1 bridge, or
  legacy board-server.mjs hook commands. Preserve sibling commands and unrelated settings.
  Remove only task-system instruction sections and replace them with the shared memory
  pointer from step 3. Remove an installer-owned local exclude entry only if recorded.

- **Handle `secure/` first — never promote it.** `.tasks/secure/` holds secrets and
  private notes; it is **never** folded into the repo's `CLAUDE.md` or `memory/`. If it's
  non-empty, ask: delete it with the rest, or relocate it (move it outside `.tasks/` to a
  path the operator names, e.g. a gitignored `./.secure/`)? Never silently delete and never
  silently promote credentials.

Then delete the `.tasks/` folder, including `dashboard.html`, `dashboard.css`, `board-hooks.mjs`, `board-server.mjs`,
`.board-version.json`, `config.json`, `board-config.js`, `MILESTONES.md` + `milestones/`, and everything the installer provisioned
**inside** it — `vendor/`, any `node_modules/` / `package.json`, and
`.install-manifest.json`. Because all of that lives under `.tasks/`,
deleting the folder removes it wholesale; the manifest's `created.files`/`created.dirs` lists
are a cross-check, not a separate cleanup pass. Deleting files from a Cowork workspace requires
permission — if a delete fails with "Operation not permitted", request it (the
`allow_cowork_file_delete` flow) rather than telling the user it's impossible.

Remove the repo-root `.gitignore`'s `.tasks/` line **only if `.tasks/config.json` records
`"git": "ignored"`** — that's the only mode that added one; in `tracked` mode no root line
exists, so touch nothing there. If `config.json` is missing (a legacy board), fall back to
the old behavior: remove a `.tasks/` line if one is present.

#### Reverse out-of-tree global changes (manifest-driven, opt-in)

Everything above is confined to the repo. The **only** thing `/tasks-start` may have changed
outside it is a globally-installed Node runtime (when the machine had none). For each entry in
the manifest's `global[]` with `wasPreexisting:false` and `succeeded:true`:

- **Offer** the exact recorded `reverseCommand`; **default to KEEP.** Never auto-run it.
- Surface the `reverseRisk` — a Node uninstall is `high`: it removes Node **system-wide** and
  can break anything else on the machine that depends on it. Make that consequence explicit:

  ```
  Setup installed Node globally (winget) because it was missing. Leave it (recommended), or
  remove it? Removing runs:  winget uninstall --id OpenJS.NodeJS.LTS -e
  (This removes Node for the whole machine — only do this if nothing else relies on it.)
  ```

- Run the reverse command **only on an explicit yes.** If kept, say so in the report so the
  user knows it's still there.
- **No manifest / unparseable** → skip this entirely (legacy path: nothing global was tracked,
  so offer nothing). **Unknown `schemaVersion`** → don't guess the shape; delete `.tasks/` as
  usual and print the raw `global[]` entries so the user can reverse them by hand.

## 7. Report

```
Task system removed. Migrated into <repo>:
- ./memory/workplace.md ← working memory (X people, X terms, X projects) + 3 open threads (incl. 1 milestone)
- ./memory/        ← glossary, X people, X projects, company context
- secure/          ← deleted | relocated to <path> (your choice — never promoted)
- host instructions ← both point to shared migrated memory
- board server     ← stopped; only owned native host hooks removed
- .tasks/          ← deleted (dashboard, board-server.mjs, milestones, config, vendor/, install manifest included)
- global Node      ← kept (or: removed via <command>) — only shown if setup installed one

Your repo now carries the context directly. Re-run /tasks-start anytime to spin the
live board back up.
```

## Safety

- **Never delete before the migration files are written and verified.** Read back the merged
  shared memory and both effective host instruction pointers to confirm the content landed, then delete `.tasks/`.
- **Merge, don't overwrite.** The repo's existing memory always wins on conflict; surface
  conflicts instead of silently resolving them.
- **Never promote `secure/`.** Secrets and private notes are relocated or deleted on the
  operator's explicit choice — never merged into the repo's `CLAUDE.md` or `memory/`, and
  never echoed into the report.
- **Remove hooks by marker, never by position.** The board hooks are identified by the
  saved command or exact bridge ownership marker (including legacy `board-server.mjs hook`) — an unrelated `SessionStart` /
  `PostToolUse` / subagent hook in the same settings file is never touched.
- If anything is ambiguous (where repo-level memory should live, whether to keep tasks), ask
  once rather than guessing — this step is hard to undo.
- If the repo is version-controlled, this is a natural commit point — defer to the
  `git-workflow` skill if it's installed; otherwise commit normally (work on a branch, write a
  descriptive message, and open a PR).
