---
name: tasks-management
description: >
  Read, prioritize, move, or complete tasks in an existing shaughv-tasks board. Use for "what is next", "what is blocked", "my tasks", or "mark this done". Defines the file formats and completion rules; routes new scoped work to tasks-create, setup to tasks-start, and external sync to tasks-update.
user-invocable: false
---

# Task Management

Tasks live in **`.tasks/TASKS.md`** — a plain-markdown file both the agent and the user (and
the dashboard) read and write. The dashboard board/list views read and write this exact
file and auto-save.

## File location

Use the selected project's `.tasks/TASKS.md`. From a nested directory, resolve the
existing board through `tasks-boards` before creating another one. If no board exists,
use tasks-start; if only its task index is missing, use [the file-format template](references/formats.md).
In a session with only uploaded files, follow [ChatGPT handoffs](references/chatgpt.md)
and return proposed updates instead of claiming to write to the project.

The live board follows the same locality rule: multiple boards can run on one machine at
once (one per repo), so resolve this repo's server from `.tasks/.board-server.json` and
verify its identity before using any board URL or API — **a port is not an identity**. See
the `tasks-boards` skill for the multi-board rules.

## Skill routing and freshness

- `/tasks-start` initializes, repairs, upgrades, relaunches, and resumes a board.
- `/tasks-create` is the preferred front door for a well-formed milestone, task, or proper
  dashboard-visible subtask; this skill defines the formats it writes.
- `/tasks-update` upgrades the existing board when needed, syncs/triages task state, and
  refreshes memory. `tasks-memory` governs that memory; `tasks-boards` governs live-server
  identity; `/tasks-remove` decommissions the system.

When the installed tasks plugin is missing or may be outdated, first try the harness-native
plugin update. If that is unavailable, fails, or still leaves freshness uncertain, use the
GitHub skill/connector to read the relevant current `main` file under
`RealEmmettS/shaughv-tasks/skills/<skill-name>/SKILL.md` and treat it as the latest task-system
contract: https://github.com/RealEmmettS/shaughv-tasks/tree/main/skills

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

## Read only the reference needed for this action

| Action | Read before writing |
|---|---|
| Add/move tasks, milestones, prerequisites, or subtasks | [File formats](references/formats.md) |
| Create or revise a task's scope, acceptance, verification, evidence, or attempts | [Task records](references/task-records.md) |
| Work in ChatGPT from uploaded files or a copied handoff | [ChatGPT handoffs](references/chatgpt.md) |
| Use a live board URL or API | The tasks-boards skill |
| Change workplace memory | The tasks-memory skill |

For a status question, read the board and relevant task notes, then answer. Do not load
every reference, scan all connected tools, or run setup just to report what is already there.
Keep a routine task small. Retain the full scope and evidence contract when the work needs it.

## How to interact

**"What's on my plate" / "my tasks":** read `.tasks/TASKS.md`, summarize Active and To-Do,
and **lead with anything overdue or due today** before the rest.

**"Add a task" / "track this":** add to To-Do as `- [ ] **Task** … #id` with a fresh id
(unique across `TASKS.md` **and** `MILESTONES.md`) and context (who it's for, due date). If
it has small board-visible steps, add them as indented subtasks under the task line and
include subtask descriptions when the next agent needs more than the subtask title. If it
depends on other tasks, add `(needs #…)` — creating any missing prerequisite tasks first so
you can reference their ids. If it belongs to a milestone, tag it `(ms #id)`. For anything
non-trivial, record its in/out scope, functional bar, evidence bar, and gate ownership, then
seed `.tasks/tasks/<id>.md` with a `TT;DR:`-led description **including its `## Verification`
checklist** (see [task records](references/task-records.md)). Move it to Active when work actually starts — and add an
`## Activity` line when you do. For a guided, interactive creation flow, use the
`tasks-create` skill.

For an actual timed reminder, use the host's scheduling tool when available. A task-board
entry alone does not send a notification; state that distinction when it affects the request.

**"Done with X" / "finished X":** find it and work the completion gates in order:

1. **Prerequisites:** every referenced prerequisite must be complete. Resolve missing task IDs
   before treating the task as ready; do not silently remove a dependency.
2. **Subtasks (hard rule, no waiver):** every proper subtask must be checked. If subtasks
   remain open, finish them, ask whether they should be dropped, or leave the parent open.
   A parent task is never marked done over an unchecked subtask — the board refuses it too.
3. **Verification (hard gate, waivable):** every `## Verification` item must be `[x]` or
   `[~]`. Run the required oracle. If evidence is missing or unavailable, leave the item `[ ]`
   and report `PARTIAL`, `BLOCKED`, or `NOT VERIFIED`; an agent cannot convert inability into a
   waiver. Use `[~]` only after an authorized owner/policy explicitly removes, defers, or makes
   the criterion not applicable, with the dated decision recorded. When useful evidence is
   deferred, create and link an owned Backlog task. Never flip a task done with `[ ]` items.
4. **Evidence receipt (for consequential work):** update `## Evidence` with criterion, oracle,
   invocation, raw result/pointer, interpretation, limitation, and status. The task's terminal
   claim is the weakest mandatory row.

Only then flip `[ ]`→`[x]`, append `(done YYYY-MM-DD)`, move to Completed, and append a closing
`## Activity` line to its detail file noting what landed.
If the contract, checklist, evidence, or subtasks must change later, reopen the task first;
never edit a completed task into a state its existing completion receipt no longer proves.

**"Done with a milestone":** a milestone can't close while any task tagged with its
`(ms #id)` is still open — hard rule, board-enforced. Ensure every child is in Completed (or
archived in the milestone's `## Completed`). If the milestone outcome has integration,
cross-task, or final-qualification criteria not entailed by ordinary children, require a final
milestone-tagged qualification task with its own Verification and Evidence receipt; it must be
complete too. Only then flip the milestone line to `[x]`, append `(done YYYY-MM-DD)`, and add a
closing `## Activity` line to `.tasks/milestones/<id>.md`.

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
- Keep Completed for ~1 week, then clear old items (or let `/tasks-update` triage them).

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
  did it: `2026-07-02 14:02 — moved To-Do → Active (emmett)` or `(agent: codex)`. On
  a solo board this is noise — skip it.
- **Respect `(owner name)`.** The owner token names who's driving a task. Don't pick up or
  rework someone else's Active task without checking first; set yourself as owner when you
  claim unowned work you'll be driving.
- **Merge conflicts are line-local by design.** One task per line means most conflicts are
  two sides adding different lines — take both. When the *same* `#id` conflicts, it's one
  item edited twice: reconcile the actual intent and supporting evidence; never assume the more advanced
  state is correct. Preserve open verification until completion is supported. In detail files, `## Activity` is append-only — union both sides' lines and
  re-sort by timestamp; for the description body, prefer the later edit and fold in
  anything unique from the other side. Pull before a board session; commit after
  meaningful task changes.

## Extracting tasks

When summarizing meetings or threads, offer to add extracted items — commitments the user
made ("I'll send that over"), action items assigned to them, follow-ups. **Ask before
adding; never auto-add without confirmation.**
