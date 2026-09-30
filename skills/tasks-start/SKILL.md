---
name: tasks-start
description: >
  Set up, open, repair, upgrade, or resume a shaughv-tasks board in a project folder.
  Use for "set up my task board", "open my board", "resume my tasks", or tasks-start.
  Creates the local dashboard and shared workplace memory, preserves existing work,
  and resumes from the current task notes. Use tasks-create to add work and
  tasks-update to triage or sync an existing board.
---

# Start or resume a task board

Give the user a working board and a clear place to resume. Codex is the primary local
workflow. The same task files can support ChatGPT when its available tools can access
them; ordinary uploaded files are snapshots, not a live board connection.

## Check access before setup

Read [host setup](references/hosts.md) for the current host. With local file and shell
access, follow the lifecycle below. Without that access, use the
[ChatGPT handoff workflow](../tasks-management/references/chatgpt.md): work from the
provided files and return proposed updates. Do not claim to launch or change a local board.

Resolve resources relative to this loaded skill. Keep all board-owned data and runtime
files under `.tasks/`. `.tasks/CLAUDE.md` is the shared workplace-memory filename retained
for compatibility; it belongs to the task system, not to one model or host.

## 1. Find the board and resume

Check `.tasks/` in the current directory, then ancestors up to the project boundary.
If only an ancestor board exists, resolve whether the user wants that board or a separate
nested board. Use an existing explicit choice; otherwise ask before creating a second board.

For an existing board, read `config.json`, `TASKS.md`, `MILESTONES.md`, and `CLAUDE.md`.
For each Active task, read its `tasks/<id>.md`: current status, next action, acceptance,
open verification, and any evidence or failed attempt that affects the next decision.
Read deeper memory only for a relevant gap. Check overdue milestone status when needed.

Honor recorded tracking, title, and host choices. For boards without config, infer tracked
versus ignored from the repo's ignore rules; use `none` outside Git. Backfill additively.
Reconcile a missing root ignore entry when config already says the board is local.

## 2. Create, repair, and upgrade (every run)

Read and follow [setup and upgrade](references/setup.md) in full. This is mandatory on
fresh setup and resume, before launching. It owns the exact scaffold, title backfill,
five-file versioned bundle, asset provisioning, and one-time tracking choice.

Preserve existing tasks, memory, custom columns, meaningful titles, and unknown config
fields. Upgrade the bundle as a unit; repair missing equal-version files; never downgrade
a newer board. Record and verify the installed version. Restart only this board if its
running server code changed. Keep stopped boards stopped during repair-only work.

## 3. Launch and verify the board

Read [board-server operations](references/board-server.md) for the launch and identity
contract, then run from the selected project:

```text
node .tasks/board-server.mjs ensure
node .tasks/board-server.mjs status
```

Verify the responding board's root and identity using `tasks-boards`, then open the returned
URL. In Codex, prefer the available in-app browser/open tool; otherwise use `ensure --open`.
Use the actual returned port. Never assume a default port identifies this project.

When Node is unavailable, follow the guarded fallback in the server reference. The static
dashboard can read and edit selected files in a supported browser; completion and task
deletion require the live server's coordinated writes.

## 4. Configure optional host hooks

Follow [host setup](references/hosts.md). Honor the recorded choice; ask only when the
active host has no decision and existing authorization does not cover it. Generate and
merge only this board's native hook entries. Read back the result and record ownership.
Codex's native trust/review remains in its own UI. Hooks are optional; unsupported hosts
use the manual workflow. Do not configure another host as a side effect.

## 5. Connect repo instructions

Read [repo instructions](references/repo-instructions.md) before adding the managed task
section to the active host's effective instructions. Preserve unrelated guidance. Point
each host to the same `.tasks/CLAUDE.md`; do not create competing memory copies.

## 6. Orient the user

Lead a resume with where the work stands, what remains unverified, and the next useful
action. For a new board, show the verified URL and explain the everyday controls:
New task, search, status/owner filters, Board/List, task details, and Memory.
The task panel's Copy handoff action gives the user a snapshot to paste into another chat.

Only when the working-memory marker is pending, offer to fill the gaps from the user's
real work. Read [memory bootstrap](references/memory-bootstrap.md) if they want that step.
An optional scan of connected sources needs the user's scope; unavailable connectors
do not prevent setup. Do not invent people, tasks, or context to make an empty board look full.

## Finish

Report the project title, verified board link, tracking choice, and what was set up or
repaired. Mention missing display assets or pending native hook review when applicable.
Keep implementation details out of the ordinary orientation. For further work, route to
tasks-create (capture), tasks-update (triage/sync), or tasks-remove (retire the board).
