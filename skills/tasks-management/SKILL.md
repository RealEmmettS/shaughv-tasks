---
name: tasks-management
description: >
  How Claude reads, writes, and reasons about the task list in `.tasks/TASKS.md`. Reference
  this whenever the user asks about their tasks, wants to add or complete tasks, asks
  "what's on my plate", "what am I waiting on", "what's due", or wants commitments tracked —
  inside a repo that uses the tasks-* system. Defines the TASKS.md format, the interaction
  verbs, and how to surface overdue / due-today / priority items. Set up by /tasks-start and
  kept current by /tasks-update.
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

- `- [ ] **Task title** - context, for whom, due date #a3f`
- Sub-bullets (indented `- [ ]`) for subtasks
- Completed: `- [x] **Task** - ... (done YYYY-MM-DD) #a3f`

The dashboard parses `## Section` headings into columns and `- [ ] **Bold**` into cards, so
keep titles bold and one task per line. Keep the `#id` LAST on the line.

### IDs & prerequisites

- **Every task has a short id** — a random base-36 tag like `#a3f` at the end of the line.
  It's assigned automatically (the dashboard backfills any task missing one). When you
  create a task, append a fresh `#xxx` that isn't already used in the file.
- **Prerequisites** go in `(needs #b2c, #d4e)` just before the id:
  `- [ ] **Deploy to prod** #a3f (needs #b2c, #d4e)`. A task whose prerequisites aren't all
  done is **blocked** — the board shows a 🔒 badge and refuses to move it into Active until
  they're checked off. This is how "waiting on" works now: a task waits on whatever it
  depends on, anywhere on the board (no dedicated column needed).
- **When creating a task that depends on others:** if those prerequisite tasks don't exist
  yet, create them first (each gets an id), then reference their ids in the new task's
  `(needs …)`. Link by id, not by title.

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
The full approach: steps, files/areas/commands involved, the design, constraints, edge cases.

## Impact
What completing this changes in the system — **intended** effects, and **possible unintended**
ones (side-effects, risks, blast radius, things to watch / not break).

## Acceptance
How we'll know it's done (criteria, tests). Links to specs / PRs / threads.

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
and context (who it's for, due date). If it depends on other tasks, add `(needs #…)` —
creating any missing prerequisite tasks first so you can reference their ids. For anything
non-trivial, seed `.tasks/tasks/<id>.md` with a `TT;DR:`-led description (see above). Move it
to Active when work actually starts — and add an `## Activity` line when you do.

**"Done with X" / "finished X":** find it, flip `[ ]`→`[x]`, append `(done YYYY-MM-DD)`,
move to Done, and append a closing `## Activity` line to its detail file noting what landed.

**"What's next" / "my queue":** read To-Do (queued-up work) and surface the next items to
pull into Active. Park not-now ideas in Backlog.

## Conventions

- **Bold** the task title for scannability.
- Include `for [person]` when it's a commitment to someone.
- Include `due [date]` for deadlines and `since [date]` to track how long something's parked.
- Sub-bullets for extra context.
- Keep Done for ~1 week, then clear old items (or let `/tasks-update` triage them).

## Surfacing what matters (light prioritization)

When asked what to focus on, don't just dump the list — triage it:

- **Overdue** (due date in the past) and **due today** come first.
- **Commitments to others** (`for [person]`) outrank private todos at equal urgency.
- Flag tasks sitting in Active 30+ days with no movement — they're candidates to drop,
  defer to Backlog, or break down.

When the user is overloaded or stuck choosing, hand off to the `personal-productivity`
skill (finite-attention frameworks) if it's installed — otherwise triage inline (lead with
overdue / due-today, then decide what to drop, defer, or delegate) rather than just reordering
the list. For breaking a fuzzy task into a demoable next step, use the `iterative-plan` skill
if installed; otherwise break it into a small, concretely demoable next action yourself.

## Extracting tasks

When summarizing meetings or threads, offer to add extracted items — commitments the user
made ("I'll send that over"), action items assigned to them, follow-ups. **Ask before
adding; never auto-add without confirmation.**
