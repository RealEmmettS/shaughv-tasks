---
name: tasks-management
description: >
  How Claude reads, writes, and reasons about the task list in `.tasks/TASKS.md`. Reference
  this whenever the user asks about their tasks, wants to add or complete tasks, asks
  "what's on my plate", "what am I waiting on", "what's due", or wants commitments tracked —
  inside a repo that uses the tasks-* system. Defines the TASKS.md and MILESTONES.md formats,
  the milestone → task → subtask hierarchy, verification checklists, the interaction verbs,
  the breakdown rules, and how to surface overdue / due-today / at-risk items. Set up by
  /tasks-start and kept current by /tasks-update.
user-invocable: false
---

# Task Management

Tasks live in **`.tasks/TASKS.md`** — a plain-markdown file both Claude and the user (and
the dashboard) read and write. The dashboard board/list views read and write this exact
file and auto-save.

## File location

**Always use `.tasks/TASKS.md` in the current working directory.** If `.tasks/` doesn't
exist yet, run `/tasks-start` first (it scaffolds the folder and the dashboard). If the
file is missing but `.tasks/` exists, create it from the template below.

The live board follows the same locality rule: multiple boards can run on one machine at
once (one per repo), so resolve this repo's server from `.tasks/.board-server.json` and
verify its identity before using any board URL or API — **a port is not an identity**. See
the `tasks-boards` skill for the multi-board rules.

## The three levels: milestone → task → subtask

Work is tracked at three levels — use the smallest one that fits:

- **Subtasks** — small required steps that live indented under a task and get checked off
  before that task can be done. Flat (no sub-subtasks), and they always move with their
  parent because they're physically nested under its line.
- **Tasks** — the unit of board movement: one line in `TASKS.md`, plus (usually) a rich
  handoff file at `.tasks/tasks/<id>.md` with its own status and activity log.
- **Milestones** — first-class groupings (epics): a dated outcome several tasks roll up
  into. Milestones live in **`.tasks/MILESTONES.md`** with detail files at
  `.tasks/milestones/<id>.md`; a task joins one with an `(ms #id)` tag. A task belongs to
  at most one milestone — or none.

For a guided way to pick the right level and create well-formed work (including the
verification checklist), use the `tasks-create` skill; the formats it writes are the ones
defined here.

## Format & template

A fresh `TASKS.md` (no example tasks):

```markdown
# Tasks

## Backlog

## To-Do

## Active

## Done
```

### Columns (the Kanban flow)

The four sections are a left-to-right flow — read them to know the state of the work:

- **Backlog** — captured but not committed yet (someday / maybe / not now).
- **To-Do** — queued and ready; *what to pick up next*.
- **Active** — being worked on *right now* (keep this short).
- **Done** — completed; recent history, cleared after a while.

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
  (live Done tasks plus archived ones — see below) over all its children.
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

- **Clearing Done tasks must not erase milestone progress.** Before removing a
  milestone-tagged task from **Done** (the "keep Done ~1 week, then clear" routine),
  append its line to the milestone's `## Completed` section first. Archived children keep
  counting toward progress — that's why tidying the board never moves a milestone
  backward.
- **When you delete a milestone**, remove the `(ms #id)` tag from any tasks that carried
  it and delete `.tasks/milestones/<id>.md`. (The board's delete does both for you.)

### Breakdown discipline: plan steps vs subtasks vs linked tasks

Use the smallest structure that gives the operator and the next agent the right visibility:

- **Description plan/checklist** — belongs in `.tasks/tasks/<id>.md` when the steps are part
  of the parent task's handoff narrative: reasoning, implementation sequence, notes,
  constraints, commands, acceptance detail, or "how to do this" context. A plan in the
  description explains the work; it is not the board-visible checklist.
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

### Task descriptions & activity log (rich detail)

`TASKS.md` stays a one-line-per-task index. Each task's **rich detail** lives in its own file
at **`.tasks/tasks/<id>.md`** (same `<id>` as the trailing `#id` on the task line). The live
board reads/writes these through the server; the modal that opens when you click a card shows
and edits them. The file has two parts:

```markdown
TT;DR: One or two plain-English sentences on what this task is and where it stands.

## Why
What this task is for; the problem/goal it serves. Whether it came from a **direct operator
order** ("operator asked for X") or was **derived** — and if derived, the reasoning/decisions
that led here (options considered, what was chosen and rejected, and why).

## Plan
The full approach: reasoning, implementation sequence, files/areas/commands involved, the
design, constraints, edge cases. Board-trackable small steps belong in proper subtasks, not
only here.

## Impact
What completing this changes in the system — **intended** effects, and **possible unintended**
ones (side-effects, risks, blast radius, things to watch / not break).

## Acceptance
How we'll know it's done (criteria, tests). Links to specs / PRs / threads.

## Verification
The tickable version of Acceptance — concrete, observable pass/fail checks, kept current:
- [ ] `npm test` passes on the changed package
- [x] Staging /health returns 200 after deploy
- [~] Operator confirmed the panel copy (waived 2026-07-02 — agent: copy superseded by #d4e)

## Status
What's already done vs. what's left, and exactly where to resume.

## Activity
- 2026-06-25 14:02 — created (operator order)
- 2026-06-25 15:10 — moved To-Do → Active
- 2026-06-25 16:30 — finished the parser; tests green; AST wiring still TODO
```

- **Lead the description with a `TT;DR:` line** (a TT;DR — a short, plain-English, jargon-free
  one-or-two-sentence summary; see the `ttdr` skill if it's installed): so a tired operator
  grasps the task at a glance. The exhaustive detail follows underneath. The board renders the
  `TT;DR:` line as a highlighted callout.
- **`## Verification` is the checklist; `## Acceptance` is the narrative.** Acceptance
  explains how we'll know it's done; Verification turns that into lines that actually get
  ticked. Seed it when the task is created (default-on — `/tasks-create` writes it), one
  concrete, independently checkable pass/fail item per line. Items have three states:
  `[ ]` open, `[x]` passed, `[~]` waived. **A task cannot be completed while any item is
  still `[ ]`** — every item must be passed or waived first; the board enforces the same
  gate. Waive by appending `(waived YYYY-MM-DD — <who>: <reason>)` to the item. The
  operator may waive from the board without giving a reason; **an agent must record a
  reason** — in the item's `(waived …)` note and as an `## Activity` line — so the record
  shows why a check was skipped. Verification lives only in the detail file, never in
  `TASKS.md`.
- **Write the description as a self-contained handoff document — be exhaustively comprehensive.**
  Assume a *different*, independent agent (or you, much later) will pick this task up cold, at
  whatever stage it's currently in, with **none** of the context in your head right now, and
  must be able to investigate, analyze, plan, and finish it from the description alone. There is
  no length limit — err on the side of too much. The headings above are a guide, not a
  straitjacket; below the TT;DR, cover at least:
  - **What & why** — exactly what the task is and what it's for.
  - **Origin / decisions** — *why we decided on it*: the decisions and reasoning that led here,
    the alternatives weighed and rejected — **or** an explicit note that it was a **direct order
    from the operator** (so the next agent doesn't relitigate a settled call).
  - **System impact** — what it changes, separating **intended** impact from **possible
    unintended** impact (side-effects, risks, what it must not break).
  - **Plan & context** — the approach, files/areas/commands, constraints, edge cases, acceptance
    criteria, and links — everything an independent agent needs to act without re-deriving it.
    If the task has small board-trackable steps, keep those as proper subtasks in `TASKS.md`;
    subtask-specific details belong under the subtask, and the parent description can explain
    why the checklist matters without duplicating it.
  - **Where it stands** — what's done vs. left, so the handoff is seamless.
  `TASKS.md` is just the one-line index; the description is where the thinking lives.
- **Append a one-line `## Activity` entry** as you make meaningful changes to a task (start,
  finish, move, key decisions, what you modified, where you left off). This is the operator's
  window into what the agent actually did, and the breadcrumb trail the next agent reads first.
  Keep entries short and timestamped (`YYYY-MM-DD HH:MM — what happened`); keep the description
  body itself current as the plan evolves so a resumed task is never working from a stale plan.
- **The task list IS the cross-session continuity layer — keep Active tasks resumable.** There
  is no separate "session" file: the **Active** column is what's in flight, and each Active
  task's `## Status` ("exactly where to resume") plus its `## Activity` log are what a future
  session (or another agent) reads to pick the work back up mid-stream. So while a task is
  Active, keep its `## Status` and `## Activity` current **as you work** — when you start, hit a
  key decision or finding, change something, or stop — not just at the end. `/tasks-start` reads
  exactly this on resume and leads with "here's where we left off," so the discipline is what
  makes resuming days later, mid-task, reliable.
- **The detail file is optional** — a task with no `.tasks/tasks/<id>.md` is fine (the board
  shows an empty description). Create it lazily the first time a task earns a real description.
- **When you delete a task, delete its `.tasks/tasks/<id>.md` too** so a future task that
  happens to reuse the id never inherits stale detail. (The board's delete does this for you;
  if you remove a task by hand-editing `TASKS.md`, remove the detail file as well.)

## How to interact

**"What's on my plate" / "my tasks":** read `.tasks/TASKS.md`, summarize Active and To-Do,
and **lead with anything overdue or due today** before the rest.

**"Add a task" / "remind me to":** add to To-Do as `- [ ] **Task** … #id` with a fresh id
(unique across `TASKS.md` **and** `MILESTONES.md`) and context (who it's for, due date). If
it has small board-visible steps, add them as indented subtasks under the task line and
include subtask descriptions when the next agent needs more than the subtask title. If it
depends on other tasks, add `(needs #…)` — creating any missing prerequisite tasks first so
you can reference their ids. If it belongs to a milestone, tag it `(ms #id)`. For anything
non-trivial, seed `.tasks/tasks/<id>.md` with a `TT;DR:`-led description **including its
`## Verification` checklist** (see above). Move it to Active when work actually starts — and
add an `## Activity` line when you do. For a guided, interactive creation flow, use the
`tasks-create` skill.

**"Done with X" / "finished X":** find it and work the completion gates in order:

1. **Subtasks (hard rule, no waiver):** every proper subtask must be checked. If subtasks
   remain open, finish them, ask whether they should be dropped, or leave the parent open.
   A parent task is never marked done over an unchecked subtask — the board refuses it too.
2. **Verification (hard gate, waivable):** every `## Verification` item must be `[x]` or
   `[~]`. Verify what you can now; for anything you genuinely can't or shouldn't verify,
   waive it **with a recorded reason** — `(waived YYYY-MM-DD — agent: <why>)` on the item
   plus an `## Activity` line — or hand it to the operator (operators may waive without a
   reason). Never flip a task done with `[ ]` verification items remaining.

Only then flip `[ ]`→`[x]`, append `(done YYYY-MM-DD)`, move to Done, and append a closing
`## Activity` line to its detail file noting what landed.

**"Done with a milestone":** a milestone can't close while any task tagged with its
`(ms #id)` is still open — hard rule, board-enforced. Ensure every child is in Done (or
archived in the milestone's `## Completed`), then flip its line in `MILESTONES.md` to `[x]`,
append `(done YYYY-MM-DD)`, and add a closing `## Activity` line to
`.tasks/milestones/<id>.md`.

**"What's next" / "my queue":** read To-Do (queued-up work) and surface the next items to
pull into Active. Park not-now ideas in Backlog.

## Conventions

- **Bold** the task title for scannability.
- Include `for [person]` when it's a commitment to someone.
- Include `due [date]` for deadlines and `since [date]` to track how long something's parked.
- Attach a task to its milestone with `(ms #id)`; set `(owner name)` on shared boards when
  someone is actively driving it.
- Proper subtasks are for small required steps the operator should see and check off in the
  board UI; use each subtask's own description for subtask-specific detail, and the parent
  task description for context and reasoning.
- Keep Done for ~1 week, then clear old items (or let `/tasks-update` triage them).

## Surfacing what matters (light prioritization)

When asked what to focus on, don't just dump the list — triage it:

- **Overdue** (due date in the past) and **due today** come first.
- **Milestones past their `(target …)` date with open children are at risk** — surface
  them with progress (`Phoenix GA: 3/7 done, target 2026-08-01, overdue`), and report
  milestone progress as N/M whenever asked what's in flight.
- **Commitments to others** (`for [person]`) outrank private todos at equal urgency.
- Flag tasks sitting in Active 30+ days with no movement — they're candidates to drop,
  defer to Backlog, or break down.

When the user is overloaded or stuck choosing, hand off to the `personal-productivity`
skill (finite-attention frameworks) if it's installed — otherwise triage inline (lead with
overdue / due-today, then decide what to drop, defer, or delegate) rather than just reordering
the list. For breaking a fuzzy task into a demoable next step, use the `iterative-plan` skill
if installed; otherwise break it into a small, concretely demoable next action yourself.

## Multi-operator boards (tracked mode)

When the board is **git-tracked** (see `/tasks-start`'s git choice), several operators and
agents share one `TASKS.md`, `MILESTONES.md`, and detail tree. This is **async**
collaboration through git — the live board's stale-write protection only covers the browser
and the file on one machine. Three light conventions keep a shared board sane:

- **Attribute Activity entries.** On a shared board, end each `## Activity` line with who
  did it: `2026-07-02 14:02 — moved To-Do → Active (emmett)` or `(agent: claude-code)`. On
  a solo board this is noise — skip it.
- **Respect `(owner name)`.** The owner token names who's driving a task. Don't pick up or
  rework someone else's Active task without checking first; set yourself as owner when you
  claim unowned work you'll be driving.
- **Merge conflicts are line-local by design.** One task per line means most conflicts are
  two sides adding different lines — take both. When the *same* `#id` conflicts, it's one
  item edited twice: keep the further-right column / more-advanced state and union the
  tokens. In detail files, `## Activity` is append-only — union both sides' lines and
  re-sort by timestamp; for the description body, prefer the later edit and fold in
  anything unique from the other side. Pull before a board session; commit after
  meaningful task changes.

## Extracting tasks

When summarizing meetings or threads, offer to add extracted items — commitments the user
made ("I'll send that over"), action items assigned to them, follow-ups. **Ask before
adding; never auto-add without confirmation.**
