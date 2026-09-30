---
name: tasks-create
description: >
  Add a task, milestone, or subtask to a shaughv-tasks board. Use for "add a task", "capture this", "break this down", "plan this work", or tasks-create. Choose the smallest useful structure, link dependencies, and define the finish line and verification for non-trivial work. Does not set up or retire a board.
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

## Check access and current state

Use the project files available to this session. In ChatGPT without writable project
access, follow [the handoff workflow](../tasks-management/references/chatgpt.md) and return
proposed changes. With access, check the current board and relevant task before writing;
reuse stable IDs and retain unrelated work.

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
  resolve only material choices not already answered by the user.

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
   bar, and gate owner using [the scoping contract](references/scoping.md). For long, ambiguous, or high-consequence work,
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

## Scope detail when the work needs it

Read [scope and progressive delivery](references/scoping.md) for non-trivial, ambiguous,
consequential, or repeatedly blocked work. It defines finish-line ownership, preservation
rules, evidence, and bounded attempts. A simple capture needs only enough context to be
useful; do not turn it into an interview or invent a large contract.

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
