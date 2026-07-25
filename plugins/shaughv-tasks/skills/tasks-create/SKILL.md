---
name: tasks-create
description: >
  Create a well-formed milestone, task, or subtask in the tasks-* system with the right level,
  links, scope, finish line, and default verification. Use for /tasks-create, "add/create/new
  task", "scope a task", "define done", "set acceptance criteria", "plan a task", "start/add a
  milestone", "break this down", "add a subtask", or "capture this as a task." Separates the
  functional and evidence bars, records gate ownership, preserves authoritative sources and
  invariants for consequential work, seeds a compact resumable detail file, and links work with
  (ms #id) / (needs #id). Writes the tasks-management contract; pairs with tasks-start,
  tasks-update, tasks-memory, and tasks-remove.
argument-hint: "[milestone|task|subtask] [title]"
---

# /tasks-create

Put new work on the board at the right level, correctly linked and verifiable. This skill
decides the level with you and writes the shapes that `tasks-management` defines — it never
redefines the formats; when in doubt about a token or template, `tasks-management` is the
contract.

Requires `.tasks/` — if it doesn't exist, run `/tasks-start` first. If the operator passed
a level and title as arguments (`/tasks-create task Ship the installer fix`), skip the
level question and go straight to that flow.

## Pick the level

Three levels, smallest structure that fits:

- **Subtask** — a small, directly required step of an *existing* task, with no independent
  owner, status, or scheduling, that should be checked off before that task is done.
  → an indented checkbox row under the parent in `TASKS.md`.
  *Rule of thumb: if it fits inside the parent's next work session, it's a subtask.*
- **Task** — a discrete unit of work that needs its own status, handoff/resume notes,
  activity log, and board movement.
  → a top-level line in `TASKS.md` with its own `#id` and (usually) a detail file.
  *Rules of thumb: if it needs its own resume notes, it's at least a task. If it fits in
  roughly one PR / one sitting, it's a task, not a milestone.*
- **Milestone** — a dated, epic-scale outcome that several tasks roll up into and whose
  progress you want to watch as a group.
  → a line in `MILESTONES.md` plus child tasks tagged `(ms #id)`.
  *Rule of thumb: 3+ tasks aimed at one dated outcome.*

Tie-breakers:

- Subtasks never grow sub-subtasks. If a subtask is sprouting its own checklist, promote it
  to a task (linked with `(needs #parent)` if order matters); if it's now several tasks,
  consider a milestone.
- Never create a milestone for a single task — just make the task.
- When the operator hands you a fuzzy blob of work ("we need to overhaul auth"), don't ask
  them to categorize it — preserve the end goal, then propose a progressive decomposition
  yourself (milestone + smallest working task + later hardening/qualification tasks) and
  confirm.

## Creating a milestone

1. Gather: title; why / what outcome it represents; target date (optional, `YYYY-MM-DD`).
2. Mint an id — **unique across `TASKS.md` and `MILESTONES.md` combined**.
3. Append the line to `.tasks/MILESTONES.md`:
   `- [ ] **Title** - note (target YYYY-MM-DD) #id`
4. Seed `.tasks/milestones/<id>.md` with the milestone detail template from
   `tasks-management` (TT;DR, Why, Scope, Status, Completed, Activity) and a created
   Activity line.
5. Child tasks: offer to tag existing tasks with `(ms #id)` and/or create new ones now
   (each via the task flow below, pre-tagged).
6. Compare the milestone outcome with ordinary child acceptance. If integration, cross-task,
   release, or final-qualification evidence is not entailed by those children, create a final
   `(ms #id)` qualification task with its own Verification and Evidence receipt.
7. Remind (once): a milestone can't close while any child—including the qualification task—is
   open. The board enforces the child gate.

## Creating a task

1. Gather: title; context (what/for whom/due); which column (default **To-Do** — Active
   only if work starts right now).
2. Scope and finish line: for anything non-trivial, propose the in-scope outcome,
   explicitly deferred/out-of-scope work, preservation invariants, functional bar, evidence
   bar, and gate owner using the contract below. For long, ambiguous, or high-consequence work,
   also record the authoritative source/current-state oracle, valid bounded non-success outcomes,
   a finite search/validation budget or checkpoint/stop rule, and one or two load-bearing premises
   with the cheapest falsifier and earliest contradictory signal. If ambitious or uncertain, use
   receding-horizon planning: record the stable dependency skeleton, then detail only the short
   next-action window with predictions and a redirect condition. Confirm only choices that
   materially change the task.
3. Milestone: does it belong to one? Offer the existing milestones by name, or spin one up
   first. Tag `(ms #id)`.
4. Prerequisites: if it depends on other work, get those tasks' ids — **creating any
   missing prerequisite tasks first** — then `(needs #a1, #b2)`.
5. Owner (shared boards): if someone is actively driving it, `(owner name)`.
6. Subtasks: small board-visible steps as indented checkbox rows, each with an optional
   `    > detail` line when the next agent needs more than the title.
7. Mint the id (unique across both files) and write the line in canonical token order:
   `- [ ] **Title** - note (needs …) (ms …) (owner …) #id`.
8. Seed `.tasks/tasks/<id>.md` for anything non-trivial: `TT;DR:` line, then Why / Scope /
   Plan / Impact / Acceptance / conditional **Attempts** and **Evidence** / **Verification** /
   Status / Activity per `tasks-management` — Verification is default-on; Attempts and Evidence
   stay absent or compact for routine work.
9. If it went straight to Active, add the `## Activity` line saying so.

## Scoping the finish line

Do not turn a fuzzy request into an unbounded task. For every non-trivial task, infer and
propose one compact scope contract:

- **In scope** — the result this task is responsible for.
- **Deferred / out of scope** — adjacent work this task is not responsible for.
- **Authoritative source/current-state oracle** — where load-bearing facts and the current
  candidate are checked.
- **Preservation invariants** — behavior, data, interfaces, user changes, or evaluators that must
  not be weakened.
- **Functional bar** — the smallest truthful outcome that must actually work for the task
  to be complete. This is never satisfied by a build, draft, or claim when the requested
  behavior itself has not been exercised.
- **Evidence bar** — the checks required for the appropriate confidence level (for example,
  local correctness, CI, release qualification, physical-device acceptance, or an external
  approval). Verification items implement this bar.
- **Gate owner** — who or what requires each costly gate: the operator, written project or
  release policy, an external approver, or the agent's own recommendation.
- **Valid bounded outcomes** — verified, partial, blocked, refuted, indeterminate, not verified,
  or unknown within a finite budget, as applicable.
- **Budget / stop rule** — for open-ended work, the finite wall-clock, tool, cost, experiment, or
  checkpoint bound that forces a truthful terminal state instead of indefinite route switching.

For a long, ambiguous, or high-consequence task, add:

- one or two **load-bearing premises** whose falsity invalidates the most downstream work;
- the cheapest falsifying probe and earliest expected contradictory signal;
- downstream task/claim state that becomes unverified if the premise fails.

Infer sensible defaults and present them as a proposal; do not interview the operator one
field at a time. Ask one combined question only when a choice materially changes cost,
duration, risk, or what "done" means.

Routine, bounded checks belong on the current task. A long soak, exhaustive platform
matrix, physical-hardware run, external approval, or other costly gate becomes a hard
completion gate only when it is essential to the functional bar or required by an owner.
Never silently omit required evidence, but do not silently promote optional evidence into
an ownerless hard gate either. State the expected cost and the risk of deferral, then honor
the owner's decision.

When an authorized operator or policy defers a non-essential evidence gate:

1. Record the dated decision under `## Scope`, `## Acceptance`, and `## Activity`.
2. Create a separately owned **Backlog** task for the evidence debt, linked with `(needs
   #id)` when it can only happen after this task.
3. Do not leave the deferred work as an open `[ ]` verification item on the current task.
   If it was already added, mark it `[~]` with the required waiver reason and link the new
   task.

This separation is a scheduling and ownership decision, not permission to claim untested
behavior as proven.

## Progressive delivery for ambitious work

When the requested task spans several systems, has multiple unknowns, needs many distinct
proof environments, or cannot be explained as one independently testable outcome, do not
create one giant task and hope it converges. Preserve the operator's actual end goal, then
propose a ladder:

1. **Basic working version** — the smallest end-to-end slice that exercises the core
   behavior and can fail informatively. Prefer a thin vertical path through the real system
   over a pile of disconnected scaffolding.
2. **Hardening steps** — separately observable tasks for edge cases, integrations,
   performance, portability, migration, polish, or recovery behavior.
3. **End-goal qualification** — the remaining evidence and release/acceptance work required
   to make the full claim.

Use proper subtasks only for small steps that remain part of one task's next work session.
Use separate linked tasks when a rung needs its own owner, status, verification, or handoff;
use a milestone when several such tasks serve the same end goal. Give the first working rung
priority and keep later rungs visible rather than silently shrinking the end goal.

## Creating a subtask

1. Ask which parent task (or take it from context), the step title, and an optional
   one-line `> detail`.
2. Append it indented under the parent's line in `TASKS.md`.
3. Remind (only when relevant): it moves with the parent, must be checked before the parent
   can complete, and never gets sub-subtasks of its own.

## Authoring the verification checklist (default-on)

Every non-trivial task gets a `## Verification` checklist by default — it's the tickable
version of `## Acceptance`, and the board hard-gates completion on it (every item must end
up `[x]` passed or `[~]` waived; see `tasks-management` for the waiver rules).

Write **concrete, observable, independently checkable** pass/fail lines:

- A command that must pass: `- [ ] npm test passes on the changed package`
- A state someone can observe: `- [ ] staging /health returns 200 after deploy`
- A confirmation that must happen: `- [ ] operator confirmed the new panel copy`

Not vague goals ("works well", "is fast"), not restatements of the title. One check per
line; aim for 1–4. Derive the first items from `## Acceptance`, then make each one
tickable. Each item must support the recorded functional or evidence bar and have a known
owner when it is costly. A pure note-task with genuinely nothing to verify may leave the
section empty — but the template still includes the section, so verification is the default
rather than an afterthought.

`[~]` is not “the agent could not run it.” It requires an authorized contract change that
removes, defers, or makes the criterion not applicable. Missing required evidence stays `[ ]` and
the task remains partial, blocked, or not verified.

When the task claims **reliability**, one passing run is insufficient. Define the repeated evidence
needed—equivalent lexical/order variants, seeds, target-like trials, or a justified sample—and the
stop rule. Do not infer repeat-run reliability from `pass@1`.

## What this skill does not do

This skill only **creates** work. Reading, triage, and completion live in
`tasks-management` (the contract + interaction verbs) and `tasks-update` (sync/triage);
setup lives in `tasks-start`. Other skills and agents adding tasks inline mid-flow use
`tasks-management`'s lightweight "Add a task" verb — this skill is the guided front door
for deliberate creation, not a gate everything must pass through.
