# Task and milestone formats

Read before editing the board index, milestone files, IDs, links, or subtasks.

## Format & template

A fresh `TASKS.md` (no example tasks):

```markdown
# Tasks

## Backlog

## To-Do

## Active

## Completed
```

### Columns (the Kanban flow)

The four sections are a left-to-right flow — read them to know the state of the work:

- **Backlog** — captured but not committed yet (someday / maybe / not now).
- **To-Do** — queued and ready; *what to pick up next*.
- **Active** — being worked on *right now* (keep this short).
- **Completed** — finished work and recent history, cleared after a while.

These exact four categories are the fresh-board default. Preserve an existing board's custom
categories and order; legacy boards whose completion category is named **Done** remain valid.

Move a task rightward as it progresses. A task can't enter **Active** while it still has an
unfinished prerequisite (see IDs & prerequisites below).

### Task format

- `- [ ] **Task title** - context, for whom, due date (needs #b2c) (ms #k7p) (owner emmett) #a3f`
- The parenthesized tokens are all optional: `(needs #…)` for prerequisites, `(ms #id)` for
  the task's milestone, `(owner name)` for who's driving it. Write them in that canonical
  order, just before the id (the parser tolerates any order, but write canonically).
- Proper subtasks are indented checkbox rows under the task line: `  - [ ] small required step`
  with optional description lines indented beneath them: `    > detail for this subtask`
- Completed: `- [x] **Task** - ... (done YYYY-MM-DD) #a3f`

The dashboard parses `## Section` headings into columns and `- [ ] **Bold**` into cards, so
keep titles bold and one task per line. Keep the `#id` LAST on the line — the task's own id
is the **bare** `#xxx` at the very end; ids inside parentheses (`(needs #b2c)`, `(ms #k7p)`)
are references to other items, never the task's own id.

### IDs & prerequisites

- **Every task has a short id** — a random base-36 tag like `#a3f` at the end of the line.
  It's assigned automatically (the dashboard backfills any task missing one). When you
  create a task, append a fresh `#xxx` that isn't already used in the file.
- **Prerequisites** go in `(needs #b2c, #d4e)` just before the id:
  `- [ ] **Deploy to prod** (needs #b2c, #d4e) #a3f`. A task whose prerequisites aren't all
  done is **blocked** — the board shows a 🔒 badge and refuses to move it into Active until
  they're checked off. This is how "waiting on" works now: a task waits on whatever it
  depends on, anywhere on the board (no dedicated column needed).
- **When creating a task that depends on others:** if those prerequisite tasks don't exist
  yet, create them first (each gets an id), then reference their ids in the new task's
  `(needs …)`. Link by id, not by title.

### Milestones (`.tasks/MILESTONES.md`)

A milestone is an epic-scale, dated grouping that several tasks roll up into. Milestones
live in their own file, one line each:

```markdown
# Milestones

- [ ] **Phoenix GA** - customer-facing launch (target 2026-08-01) #k7p
- [x] **Billing rewrite** - (target 2026-05-01) (done 2026-05-04) #q2m
```

- Same base-36 id scheme as tasks, and **ids are unique across `TASKS.md` and
  `MILESTONES.md` combined** — when you mint an id for either file, check both. The
  dashboard backfills and de-dupes across both files.
- `(target YYYY-MM-DD)` is the milestone's optional due date. Done = `[x]` +
  `(done YYYY-MM-DD)`.
- Tasks join a milestone by carrying `(ms #id)` — one milestone per task, at most.
  **Progress is derived, never stored**: a milestone's progress is its done children
  (live Completed tasks plus archived ones — see below) over all its children.
- **A milestone can't be completed while any of its tasks is still open** — hard rule; the
  board enforces it too. Never flip a milestone `[x]` over open children.
- Each milestone's rich detail lives at **`.tasks/milestones/<id>.md`** — lazy/optional,
  the same TT;DR-led pattern as task detail files, deleted with the milestone:

```markdown
TT;DR: One or two plain-English sentences on the outcome this milestone represents and where it stands.

## Why
The goal this milestone serves; why these tasks are grouped and what "done" means at the epic level.

## Scope
What this milestone covers — and, just as important, what's explicitly out of scope.

## Status
Progress (N/M child tasks done), what's blocking the rest, target-date risk.

## Completed
Archive of child tasks cleared from the board (see below):
- [x] **Ship installer fix** (done 2026-06-28) #a3f

## Activity
- 2026-07-02 10:00 — created (operator order)
- 2026-07-02 10:05 — tagged #a3f, #b2c under this milestone
```

- **Clearing Completed tasks must not erase milestone progress.** Before removing a
  milestone-tagged task from **Completed** (the "keep Completed ~1 week, then clear" routine),
  append its line to the milestone's `## Completed` section first. Archived children keep
  counting toward progress — that's why tidying the board never moves a milestone
  backward.
- **When you delete a milestone**, remove the `(ms #id)` tag from any tasks that carried
  it and delete `.tasks/milestones/<id>.md`. (The board's delete does both for you.)

### Breakdown discipline: plan steps vs subtasks vs linked tasks

Use the smallest structure that gives the operator and the next agent the right visibility:

- **Description plan/checklist** — belongs in `.tasks/tasks/<id>.md` when the steps are part
  of the parent task's handoff narrative: a stable dependency skeleton plus a short
  next-action window with predictions and a redirect condition. Preserve coarse later
  dependencies and phase gates; revise the local window from evidence. It is not the
  board-visible checklist.
- **Proper subtasks** — belong as indented checkbox rows in `.tasks/TASKS.md` and are
  visible/editable in the dashboard modal's **Subtasks** section. Use these for small,
  directly required steps that should be checked off on the board before the parent task is
  considered finished. Each subtask can also carry its own indented description lines for
  agent-facing detail or handoff notes specific to that subtask. Call these **subtasks**,
  not "sub-items."
- **Separate linked tasks** — use a top-level task with `(needs #...)` when the work is large
  enough to need its own owner, status, rich detail file, activity log, scheduling, or separate
  board movement. This is for real dependent work, not tiny checklist steps.

Agent rule: when creating or decomposing work, do **not** bury board-trackable small steps as
plain text inside the parent task description. Put them in the task's proper subtasks, and put
any details for a specific subtask in that subtask's own description. Parent descriptions may
include a plan, but should not duplicate the operational subtask checklist unless extra
explanation is needed. When updating an existing task, if you find obvious checklist-only lines
in the parent description and they are safe to move, migrate them into proper subtasks and move
subtask-specific detail into subtask descriptions.

Markdown example:

```markdown
- [ ] **Ship installer fix** - Windows setup reliability (needs #b2c) #a3f
  - [ ] Add MSVC detection
    > Use vswhere.exe and require Microsoft.VisualStudio.Component.VC.Tools.x86.x64.
  - [ ] Update install panel copy
    > Keep TR-300, SD-300, and ND-300 wording aligned.
```
