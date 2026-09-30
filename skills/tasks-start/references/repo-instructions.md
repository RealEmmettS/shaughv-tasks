# Connect the task system to repo instructions

On every setup or relaunch, check the target repo's **root `CLAUDE.md` and `AGENTS.md`**. These
files (or effective `AGENTS.override.md` for Codex) are what future agents read before they discover `.tasks/`, so they need a concise
top-level description of how this repo uses the task system.

- Read the effective Codex instructions and Claude root instructions if they exist. If one is missing, treat it as needing the section.
- If either file is missing a clear "Task management system" / "Tasks" section, offer to add
  one; if the operator asked for unattended setup, add it directly. Never clobber existing
  instructions — append or update only the task-system section.
- The section should stay concise and explain:
  - board and milestone sources of truth, task ids/links, and proper subtasks;
  - compact per-task state: contract, unresolved Verification, conditional Evidence/Attempts,
    Status, Activity, failed routes, and exact next action;
  - missing evidence is never an agent waiver; milestones may need a final qualification task;
  - secrets, shared-board attribution/ownership, and board identity;
  - skill routing and the GitHub freshness fallback.

Suggested section:

```markdown
## Task management system

This repo uses the SHAUGHV `tasks-*` system. Before task work, read `.tasks/CLAUDE.md`
for shared workplace memory in both Codex and Claude Code; read deeper `.tasks/memory/`
files as needed. The board source of truth is
`.tasks/TASKS.md`; milestones (dated epics) live in `.tasks/MILESTONES.md` and tasks join
one with `(ms #id)`. Each task's compact continuation packet lives at
`.tasks/tasks/<id>.md`: contract/acceptance, unresolved `## Verification`, conditional
`## Evidence` and `## Attempts`, `## Status`, and `## Activity`.

Use proper subtasks for small required steps that should be visible and checkable in the
dashboard: indented checkbox rows under the parent in `TASKS.md`, optionally followed by
`    > detail`. Work needing its own status, owner, evidence, or handoff is a separate
top-level task linked with `(needs #id)`.

Completion gates (board-enforced): a task can't be marked done while a subtask is unchecked,
or while a `## Verification` item is `[ ]`. `[~]` is only an authorized removal, deferral,
or not-applicable decision; missing/unavailable evidence stays open and the task remains
partial, blocked, or not verified. A milestone cannot close over open children; add a final
qualification child when ordinary tasks do not entail the milestone outcome.

For non-trivial work, record scope/non-goals, invariants, functional/evidence bars, gate owners,
authoritative oracles, truthful outcomes, and a finite stop rule for open work. Keep verified
state/evidence separate from hypotheses. Plan with a stable dependency skeleton plus a short
next-action window, predictions, and redirect condition. Log Attempts only for uncertain/repeated
work and Evidence for consequential completion. After equivalent no-information cycles, freeze
that route, classify/audit the recurrence, then change the experiment or return a truthful boundary.

Never put secrets (API keys, tokens, credentials) in `TASKS.md`, detail files, `CLAUDE.md`,
or `memory/` — use env vars / the OS keychain, or `.tasks/secure/` (gitignored).

Resolve the per-repo live board from `.tasks/.board-server.json` (or
`node .tasks/board-server.mjs status`) and verify identity before using its URL/API.

Routing: `/tasks-start` initializes/resumes; `/tasks-create` adds scoped work;
`tasks-management` defines formats/completion; `/tasks-update` syncs/triages;
`tasks-memory` governs workplace memory; `tasks-boards` governs board identity;
`/tasks-remove` decommissions. Companion skills are optional if installed.

If the installed tasks plugin is missing or may be older than the board, first try the
harness's native plugin update. If that is unavailable, fails, or still leaves version
freshness uncertain, use the GitHub skill/connector to read the relevant current file from
`RealEmmettS/shaughv-tasks` on `main` (`skills/<skill-name>/SKILL.md`) and use that as the
latest operating guidance: https://github.com/RealEmmettS/shaughv-tasks/tree/main/skills
```
