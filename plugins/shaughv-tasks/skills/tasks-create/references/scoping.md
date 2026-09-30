# Scope and progressive delivery

Read for non-trivial, ambiguous, consequential, or repeatedly blocked work.

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
