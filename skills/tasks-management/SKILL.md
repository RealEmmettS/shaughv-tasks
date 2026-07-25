---
name: tasks-management
description: >
  How Claude reads, writes, and reasons about the task list in `.tasks/TASKS.md`. Reference
  this whenever the user asks about their tasks, wants to add or complete tasks, asks
  "what's on my plate", "what am I waiting on", "what's due", or wants commitments tracked —
  inside a repo that uses the tasks-* system. Defines the TASKS.md and MILESTONES.md formats,
  the milestone → task → subtask hierarchy, scope and finish-line contracts, verification
  checklists, bounded convergence rules, the interaction verbs, the breakdown rules, and how
  to surface overdue / due-today / at-risk items. Set up by /tasks-start and kept current by
  /tasks-update.
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

## Scope
What is in scope and what is explicitly deferred/out of scope. Record any dated operator
decision that changes the finish line, especially a costly evidence gate moved to a separate
owned backlog task. Name preservation invariants, approval boundaries, and the authoritative
source/current-state oracle for load-bearing facts.

## Plan
A stable global dependency skeleton and phase gates, followed by a short next-action window.
For each near-term action, name the live obligation/hypothesis, predicted observation, oracle,
and redirect condition. Preserve coarse later dependencies without prematurely scripting them;
revise the local window when evidence changes. Board-trackable small steps are proper subtasks.

## Impact
What completing this changes in the system — **intended** effects, and **possible unintended**
ones (side-effects, risks, blast radius, things to watch / not break).

## Acceptance
**Functional bar:** the smallest truthful outcome that must actually work.
**Evidence bar:** the proof required for the appropriate confidence or release level.
**Gate ownership:** who or what requires each costly gate, and which gates may be deferred.
**Valid bounded outcomes:** verified / partial / blocked / refuted / indeterminate /
not verified / unknown within budget, as applicable.
**Budget / stop rule:** for open-ended work, the finite search/validation bound or checkpoint.
Links to specs / PRs / threads.

## Attempts
Conditional — use for uncertain, diagnostic, or repeated work:
| Obligation / starting state | Premise / causal hypothesis | Strategy / action | Prediction | Oracle / observation / evidence pointer | State delta / information gain | Verdict / re-entry |
|---|---|---|---|---|---|---|

## Evidence
Conditional — use for consequential completion:
| Criterion | Oracle / invocation | Raw result or pointer | Interpretation | Limitation | Status |
|---|---|---|---|---|---|
| | | | | | PASS / FAIL / NOT RUN / INDETERMINATE |

## Verification
The tickable version of Acceptance — concrete, observable pass/fail checks, kept current:
- [ ] `npm test` passes on the changed package
- [x] Staging /health returns 200 after deploy
- [~] Panel-copy approval deferred by operator (waived 2026-07-02 — operator: moved to #d4e)

## Status
What's already done vs. what's left, and exactly where to resume.

## Activity
- 2026-06-25 14:02 — created (operator order)
- 2026-06-25 15:10 — moved To-Do → Active
- 2026-06-25 16:30 — finished the parser; tests green; AST wiring still TODO
```

- **Lead the description with a `TT;DR:` line** (a TT;DR — a short, plain-English, jargon-free
  one-or-two-sentence summary; see the `ttdr` skill if it's installed): so a tired operator
  grasps the task at a glance. Compact decision-relevant detail follows underneath. The board renders the
  `TT;DR:` line as a highlighted callout.
- **`## Verification` is the checklist; `## Acceptance` is the narrative.** Acceptance
  defines the functional bar, evidence bar, and gate ownership; Verification turns the
  required evidence into lines that actually get ticked. Seed it when the task is created
  (default-on — `/tasks-create` writes it), one concrete, independently checkable pass/fail
  item per line. Every item must support one of the recorded bars, and a costly item must
  have a named owner or written policy behind it. Items have three states:
  `[ ]` open, `[x]` passed, `[~]` waived. **A task cannot be completed while any item is
  still `[ ]`** — every item must be passed or waived first; the board enforces the same
  gate. `[~]` means an authorized operator, policy, or accepted contract change explicitly
  removed, deferred, or made the criterion not applicable. Append
  `(waived YYYY-MM-DD — <who>: <reason>)` and log the decision. A reason records the decision; it
  does not grant authority. **Missing, unavailable, or unrun required evidence is not a waiver**:
  leave it `[ ]` and report `PARTIAL`, `BLOCKED`, or `NOT VERIFIED`. Verification lives only in
  the detail file, never in `TASKS.md`.
- **Write the description as a compact typed handoff.** Assume a different agent will pick the
  task up cold and must make the next correct decision without trusting unsupported prose. Keep:
  - objective, origin, authority, scope/non-goals, preservation invariants, and acceptance;
  - verified current state with exact evidence pointers, clearly separated from inference;
  - material decisions and why;
  - live load-bearing premises, causal hypotheses, and earliest disconfirming signals;
  - failed/superseded routes and re-entry conditions;
  - unresolved contradictions, open obligations, risks, and owner decisions;
  - budget/stop state, exact next bounded action, and expected observation.
  Keep raw chronology, huge logs, and bulky sources at stable paths and point to them only when
  relevant. `TASKS.md` is the one-line index; the detail file is the active decision packet.
- **Append a one-line `## Activity` entry** as you make meaningful changes to a task (start,
  finish, move, key decisions, what you modified, where you left off). This is the operator's
  window into what the agent actually did, and the breadcrumb trail the next agent reads first.
  Keep entries short and timestamped (`YYYY-MM-DD HH:MM — what happened`); keep the description
  body itself current as the plan evolves so a resumed task is never working from a stale plan.
- **The task list IS the cross-session continuity layer — keep Active tasks resumable.** There
  is no separate "session" file: the **Active** column is what's in flight, and each Active
  task's `## Status`, unresolved Verification, current `## Evidence`, latest material
  `## Attempts` row, and `## Activity` are what a future session reads. Keep them current when
  evidence, a decision, a route, or the next action changes—not for every conversational turn.
- **The detail file is optional** — a task with no `.tasks/tasks/<id>.md` is fine (the board
  shows an empty description). Create it lazily the first time a task earns a real description.
- **When you delete a task, delete its `.tasks/tasks/<id>.md` too** so a future task that
  happens to reuse the id never inherits stale detail. (The board's delete does this for you;
  if you remove a task by hand-editing `TASKS.md`, remove the detail file as well.)

### Finish-line ownership and bounded convergence

For every non-trivial task, keep two bars explicit:

- The **functional bar** is the smallest truthful result that must actually work. A build,
  staged change, CI run, or written claim is not a substitute for exercising the requested
  behavior.
- The **evidence bar** is the proof required for the appropriate confidence level. Routine,
  bounded checks stay on the task. Long soaks, exhaustive matrices, physical-device runs,
  external approvals, and other costly checks are hard gates only when essential to the
  functional bar or required by an identified owner.

Never silently weaken required evidence. When a non-essential evidence gate is expensive,
blocking, or has no clear owner, tell the operator the expected cost and deferral risk and
ask for one decision. If an authorized owner defers it, record the dated decision, waive any already-created
verification item with a reason, and create/link a separately owned Backlog task for that
evidence debt. Do not let the work disappear, and do not keep the current task open forever
for an ownerless recommendation.

Every execution/verification cycle must produce at least one of: a passed check, concrete
failure evidence, or a narrowed hypothesis. A staged-but-uncommitted fix that the real
validator cannot see, a silent failure, or an identical retry produced no new information.
Put the candidate state where the actual validator can observe it; when a check fails without
explaining why, improve its reporting before changing more product code.

After **two structurally equivalent cycles with no information gain**, freeze that route—not the
whole objective—and update `## Attempts`, `## Status`, and `## Activity`. Compare target,
starting state, premise/causal hypothesis, strategy family, evidence source/oracle, prediction,
observation, and state delta. Then audit:

1. load-bearing premise and the first contradictory signal;
2. observer/source of truth and whether it can see the candidate;
3. evaluator or acceptance oracle integrity;
4. artifact, runtime, environment, permissions, and confounders;
5. representation or strategy family;
6. task grain.

Invalidate dependent claims when a premise is contradicted. If grain is the issue, preserve the
full end goal but re-scope the work into a progressive ladder:

1. the smallest end-to-end version that can actually run and produce useful evidence;
2. separately observable hardening/integration steps; and
3. the remaining end-goal qualification.

Make small same-session steps proper subtasks; make independently owned, verified, or
resumable rungs separate linked tasks; use a milestone when several tasks serve the same end
goal. Start with the basic working rung, then move upward. Otherwise change the experiment,
improve observability, change representation/oracle/method, split an authorized deferred gate,
or ask the operator for the missing decision. Merely renaming or rerunning the same attempt is
not a new experiment. Two cycles are an audit trigger, not a universal task limit; declared noisy
replication needs an independence model, sample count, and stop rule. Tool retries and unattended
validation must always have a bound. Classify a recurrence before recovery: token repetition needs
interruption/compaction; epistemic repetition needs a new discriminating source; action-policy
repetition needs a different intervention family; false-premise trajectories invalidate dependent
state. At the task budget or stop condition, preserve the strongest supported result and return a
truthful bounded outcome—do not keep work Active merely to continue.

## How to interact

**"What's on my plate" / "my tasks":** read `.tasks/TASKS.md`, summarize Active and To-Do,
and **lead with anything overdue or due today** before the rest.

**"Add a task" / "remind me to":** add to To-Do as `- [ ] **Task** … #id` with a fresh id
(unique across `TASKS.md` **and** `MILESTONES.md`) and context (who it's for, due date). If
it has small board-visible steps, add them as indented subtasks under the task line and
include subtask descriptions when the next agent needs more than the subtask title. If it
depends on other tasks, add `(needs #…)` — creating any missing prerequisite tasks first so
you can reference their ids. If it belongs to a milestone, tag it `(ms #id)`. For anything
non-trivial, record its in/out scope, functional bar, evidence bar, and gate ownership, then
seed `.tasks/tasks/<id>.md` with a `TT;DR:`-led description **including its `## Verification`
checklist** (see above). Move it to Active when work actually starts — and add an
`## Activity` line when you do. For a guided, interactive creation flow, use the
`tasks-create` skill.

**"Done with X" / "finished X":** find it and work the completion gates in order:

1. **Subtasks (hard rule, no waiver):** every proper subtask must be checked. If subtasks
   remain open, finish them, ask whether they should be dropped, or leave the parent open.
   A parent task is never marked done over an unchecked subtask — the board refuses it too.
2. **Verification (hard gate, waivable):** every `## Verification` item must be `[x]` or
   `[~]`. Run the required oracle. If evidence is missing or unavailable, leave the item `[ ]`
   and report `PARTIAL`, `BLOCKED`, or `NOT VERIFIED`; an agent cannot convert inability into a
   waiver. Use `[~]` only after an authorized owner/policy explicitly removes, defers, or makes
   the criterion not applicable, with the dated decision recorded. When useful evidence is
   deferred, create and link an owned Backlog task. Never flip a task done with `[ ]` items.
3. **Evidence receipt (for consequential work):** update `## Evidence` with criterion, oracle,
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
