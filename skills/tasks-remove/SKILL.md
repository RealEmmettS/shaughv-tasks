---
name: tasks-remove
description: >
  Decommission the tasks-* system in a repo and flatten its useful parts back into the
  repository itself. Use whenever the user says /tasks-remove, "remove the task system", "tear
  down tasks", "uninstall the task system", "flatten my tasks into the repo", "promote my
  memory", "I'm done with the dashboard", or otherwise wants the `.tasks/` scaffolding gone
  with its knowledge preserved. Merges `.tasks/CLAUDE.md` working memory into the repo's root
  `CLAUDE.md`, moves `.tasks/memory/` into a repo-level `memory/`, optionally preserves open
  tasks, then deletes `.tasks/` (dashboard included). Destructive — always confirm and show
  the migration plan first. The inverse of /tasks-start.
argument-hint: "[--keep-tasks] [--dry-run]"
---

# /tasks-remove

Take down the `.tasks/` system **without losing what it learned.** The working memory and
deep memory get promoted into the repo's own `CLAUDE.md` and `memory/` so the repo keeps the
context permanently; then `.tasks/` is deleted. This is the inverse of `/tasks-start`.

This is **destructive** (it deletes a folder). Always show the migration plan and get an
explicit "yes" before deleting anything. `--dry-run` shows the plan and stops.

## 1. Confirm the system exists

If there's no `.tasks/` in the current working directory, say so and stop — nothing to
remove.

Read everything first: `.tasks/CLAUDE.md`, `.tasks/memory/**`, `.tasks/TASKS.md`, and — for a
complete uninstall — **`.tasks/.install-manifest.json`** (written by `/tasks-start`'s
installer). The manifest is the source of truth for everything provisioned: the vendored
display assets, any npm installs, and crucially any **out-of-tree global changes** (e.g. a
Node runtime installed because the machine didn't have one). If it's missing or unparseable,
fall back to the legacy marker-only teardown (hooks + `.tasks/` deletion, no global reversal).

## 2. Present the migration plan

Show the user exactly what will happen before touching anything:

```
/tasks-remove plan for <repo>:

  board server          →  stopped (node .tasks/board-server.mjs stop)
  .claude/settings*.json →  board-maintenance hooks removed (other hooks/keys kept)
  .tasks/CLAUDE.md      →  merge into ./CLAUDE.md  (## Memory section)
  .tasks/memory/        →  merge into ./memory/    (glossary.md, people/, projects/, context/)
  .tasks/TASKS.md       →  3 open items → ## Open threads in ./CLAUDE.md; Done items archived
  .tasks/vendor/, .tasks/.install-manifest.json, board-server.mjs, dashboard.html → deleted with .tasks/
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

## 3. Promote working memory → repo `CLAUDE.md`

Merge `.tasks/CLAUDE.md` into the repo's root `CLAUDE.md`:

- **If root `CLAUDE.md` doesn't exist:** create it. Put the migrated content under a clear
  `# Memory` (or `## Workplace memory`) section so it reads as project memory Claude Code
  auto-loads.
- **If it exists:** merge, don't clobber. Append the people / terms / projects / preferences
  under a `## Workplace memory` section. De-duplicate against anything already there; if a
  fact conflicts, keep the repo's existing line and note the alternate rather than
  overwriting.
- Preserve the table formats from `tasks-memory` so the promoted memory stays scannable.
- **Strip the bootstrap marker.** `.tasks/CLAUDE.md` starts with an internal
  `<!-- tasks-bootstrap: pending|done -->` comment used only by `/tasks-start`'s resume logic —
  drop it from the promoted content; it has no meaning in the repo's own `CLAUDE.md`.

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

- **Default:** summarize remaining **Active** and **To-Do** items into an `## Open
  threads` list at the bottom of the repo's `CLAUDE.md` (or a short `TODO` note), so nothing
  in flight is lost. Drop the `Done`/`Backlog` archive unless asked to keep it.
- **`--keep-tasks`:** instead, move `.tasks/TASKS.md` to the repo root as `TASKS.md` (or
  append to an existing one) and leave it tracked.

## 6. Stop the board, remove the hooks, delete `.tasks/`

Before deleting, tear down what `/tasks-start` set up **outside** `.tasks/`:

- **Stop the live server:** run `node .tasks/board-server.mjs stop` (kills the server via its
  recorded PID and clears its state files). Harmless if it isn't running.
- **Remove the board-maintenance hooks:** open `.claude/settings.local.json` (and
  `.claude/settings.json` — check both). In each, delete ONLY the hook entries whose
  `command` contains the marker **`board-server.mjs hook`** (across `SessionStart`,
  `PostToolUse`, `SubagentStart`, `SubagentStop`). Prune any hook array that becomes empty,
  then `hooks` if it empties, then the file itself if it becomes `{}`. **Never remove a hook
  you can't positively identify by that marker** — every other hook and key stays untouched.

Then delete the `.tasks/` folder, including `dashboard.html`, `board-server.mjs`, and
everything the installer provisioned **inside** it — `vendor/`, any `node_modules/` /
`package.json`, and `.install-manifest.json`. Because all of that lives under `.tasks/`,
deleting the folder removes it wholesale; the manifest's `created.files`/`created.dirs` lists
are a cross-check, not a separate cleanup pass. Deleting files from a Cowork workspace requires
permission — if a delete fails with "Operation not permitted", request it (the
`allow_cowork_file_delete` flow) rather than telling the user it's impossible.

Remove any `.tasks/` line you added to `.gitignore` during `/tasks-start`.

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
- ./CLAUDE.md      ← working memory (X people, X terms, X projects) + 3 open threads
- ./memory/        ← glossary, X people, X projects, company context
- board server     ← stopped; board-maintenance hooks removed from .claude/settings*.json
- .tasks/          ← deleted (dashboard, board-server.mjs, vendor/, install manifest included)
- global Node      ← kept (or: removed via <command>) — only shown if setup installed one

Your repo now carries the context directly. Re-run /tasks-start anytime to spin the
live board back up.
```

## Safety

- **Never delete before the migration files are written and verified.** Read back the merged
  `CLAUDE.md` / `memory/` to confirm the content landed, then delete `.tasks/`.
- **Merge, don't overwrite.** The repo's existing memory always wins on conflict; surface
  conflicts instead of silently resolving them.
- **Remove hooks by marker, never by position.** The board hooks are identified by the
  `board-server.mjs hook` string in their command — an unrelated `SessionStart` /
  `PostToolUse` / subagent hook in the same settings file is never touched.
- If anything is ambiguous (where repo-level memory should live, whether to keep tasks), ask
  once rather than guessing — this step is hard to undo.
- If the repo is version-controlled, this is a natural commit point — defer to the
  `git-workflow` skill if it's installed; otherwise commit normally (work on a branch, write a
  descriptive message, and open a PR).
