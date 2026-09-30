# Task notes, evidence, and completion contracts

Read before creating a non-trivial task record or changing its acceptance, verification,
evidence, or attempt history. Routine status questions do not need this entire reference.

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
