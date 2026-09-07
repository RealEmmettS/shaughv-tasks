# Changelog

All notable changes to this plugin are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

A plain-English companion lives at [HUMAN_CHANGELOG.md](./HUMAN_CHANGELOG.md) and is kept in lockstep with this file — see the changelog rule in [CLAUDE.md](./CLAUDE.md).

## [1.2.0] — 2026-09-07

### Added
- Dock task details beside the board on wide screens, with an overlay on smaller screens.
- Expose ordered Scope, Plan, Evidence, Status, and other task-record sections, including tables.
- Add System / Light / Dark appearance with live OS tracking and preserved explicit choices.
- Add a portable native-hook generator for Codex and Claude, independent per-host setup choices,
  and explicit shared-memory pointers from each host's effective root instructions.
- Bundle the supplied Makira Light weight and canonical SHAUGHV loader as pinned local assets.

### Improved
- Redesign the board, list, milestones, and memory around SHAUGHV typography, precise borders,
  compact navigation, readable task properties, keyboard controls, and responsive detail views.
- Lead install guidance with Codex and document native hook trust, namespaced Claude skills,
  additive configuration migration, and teardown into one shared workplace-memory document.
- Preserve description drafts through panel navigation and property re-renders; preserve the
  exact bytes and order of unknown detail sections, including fenced Markdown headings.

### Fixed
- Retain failed memory and milestone drafts, confirm discards, and block duplicate or
  overlapping edits while their saves are pending.
- Report server startup failure when the expected board identity never becomes available.
- Hide detached Windows server processes and resolve hooks from host payload cwd even when
  the shell is in a nested directory; never interpret a Codex plan update as approval.
- Avoid duplicate remote brand scripts and use only the supplied local font declarations.

### Security
- Share escaped, protocol-limited Markdown rendering between tasks and memory. Remove dynamic
  inline memory handlers and escape file/directory/section names before placing them in HTML.

### Behind the scenes
- Keep the zero-dependency runtime; package dashboard CSS and the hook generator with the
  versioned board bundle, synchronize all manifests, and regenerate the Codex mirror.

## [1.1.1] — 2026-07-28

The board now uses a deliberate two-family type system: Makira carries reading, naming, and
actions; Gail Rock carries technical state, compact metadata, and verification surfaces.

### Added
- Bundle the authorized Makira and Gail Rock WOFF2 files at weights 400, 500, 600, and 700 so the
  complete board type system provisions from shipped bytes offline.

### Improved
- Apply Makira to board, task, and milestone names; descriptions and notes; people and editable
  values; primary navigation; and action buttons. Apply Gail Rock to workflow columns, section and
  field labels, identifiers, dates, counts, status/evidence chips, paths, activity, freshness, raw
  Markdown editors, and compact system utilities.
- Link the pinned local `fonts.css` with relative URLs so both localhost and direct `file://` boards
  resolve the same shipped font files. Makira retains its byte-identical private CDN files as
  secondary fallbacks; Gail Rock remains shipped-first with system fallbacks.
- Expand the installer inventory from eight to 11 assets: eight fonts, `fonts.css`, anime.js, and
  the animated brand mark.

### Fixed
- Pin `fonts.css` itself so upgrading a 1.1.0 board replaces the stale type declarations rather
  than retaining a hash-valid but obsolete font configuration.
- Reflow the mobile header so navigation and utilities stay inside the viewport, and constrain
  long task and milestone titles so their compact IDs no longer overlap them.

### Removed
- Remove IBM Plex Mono and Unbounded from board links, shipped files, installer entries, and live
  documentation. Asset reconciliation safely removes their two plugin-owned font directories.

### Behind the scenes
- Keep all plugin manifests and the portable board marker in 1.1.1 lockstep; task data, routes,
  skill commands, and board migrations are unchanged.

## [1.1.0] — 2026-07-24

The durable task contract now carries compact evidence and causal state across Claude, Codex,
operators, and future sessions without turning the board into a transcript archive. Missing proof
can no longer be converted into an agent waiver or an externally asserted completion.

### Added
- `tasks-management` adds conditional `## Attempts` rows for uncertain/diagnostic/repeated work:
  obligation and starting state, load-bearing premise/causal hypothesis, strategy/action,
  prediction, oracle plus raw observation/evidence pointer, state delta/information gain, verdict,
  and re-entry condition.
- `tasks-management` adds conditional `## Evidence` completion receipts for consequential work:
  criterion, authoritative oracle/invocation, raw result or pointer, semantic interpretation,
  limitation, and `PASS` / `FAIL` / `NOT RUN` / `INDETERMINATE`. The task's final claim is the
  weakest mandatory row.
- Milestone creation/completion now requires a final milestone-tagged qualification task whenever
  cross-task integration or acceptance is not entailed by ordinary children. The existing
  board-enforced child gate protects the epic outcome without a dashboard schema change.

### Improved
- Per-task detail files are compact typed continuation packets rather than unlimited exhaustive
  narratives: objective/acceptance/authority, verified state and exact evidence pointers,
  decisions/invariants, live premises and disconfirming signals, failed routes/re-entry conditions,
  unresolved obligations, a stable global dependency skeleton, and a short next-action window
  with predictions and a redirect condition. Coarse later dependencies remain visible without
  stale full overplanning; raw logs and chronology stay at stable pointers.
- `tasks-create` records authoritative sources/current-state oracles, preservation invariants,
  truthful bounded outcomes, and cheap load-bearing-premise falsifiers for long, ambiguous, or
  high-consequence tasks while keeping routine work light. Reliability claims require declared
  repeated evidence rather than one pass.
- The bounded-convergence audit freezes one non-informative route, compares structured attempts,
  then checks premise, observer/source of truth, evaluator, artifact/environment, strategy, and
  task grain. It distinguishes token, epistemic, action-policy, and false-premise recurrence, and
  open-ended work records a finite budget or stop rule. A contradictory signal invalidates
  dependent claims; two cycles remain an audit trigger, not a universal task stop.
- `/tasks-start` resumes from acceptance, unresolved checks, evidence, latest material attempt,
  failed-route state, Status, and next action. Its injected target-repo guidance and SessionStart
  nudge are shorter and typed; approved plans put only genuinely in-flight bounded work in Active;
  subagent completion is ingested as evidence before board completion.
- `/tasks-update` distinguishes external completion, board completion, and acceptance verification;
  surfaces semantic stagnation, stale contradictions, repeated symptom patches, unsupported
  completion, and one-run reliability claims immediately; and reports external-but-unverified work
  honestly.
- `tasks-memory` explicitly treats memory as context, not authority for current runtime state,
  completion, permissions, or time-sensitive facts. `tasks-remove` preserves compact typed open
  work without migrating transcripts or full attempt histories; evidence-debt Backlog obligations
  survive automatically and the remaining Backlog receives an explicit preserve/discard decision.

### Fixed
- `[~]` now means an authorized operator, policy, or accepted contract change explicitly removed,
  deferred, or made a criterion not applicable. A reason records that decision; it does not grant
  authority. Missing, unavailable, or unrun required evidence remains `[ ]` and leaves the task
  `PARTIAL`, `BLOCKED`, or `NOT VERIFIED`.
- The dashboard now requires an authority acknowledgement and reason before waiving, removing, or
  changing any Verification criterion; settled edits reset open, every decision enters
  Activity, and a legacy/malformed reasonless waiver cannot unlock completion. Completion waits
  for the local save queue, re-reads the durable detail, then couples that exact content revision
  to the checked `TASKS.md` write under serialized server locks. A concurrent checklist or board
  edit returns a retryable conflict rather than admitting stale completion. The `file://`
  fallback identity-matches `TASKS.md` to the selected `.tasks/` folder and refuses stale detail
  saves, but intentionally locks completion and deletion because browser file access cannot make
  either cross-file commit atomic. Detail and lifecycle controls stay locked across their
  asynchronous boundary, and modal epochs prevent late reads or saves from corrupting a newly
  opened task.
  External `TASKS.md` refreshes defer while modal detail is unsaved and otherwise rebind the
  modal to the new task object, preventing detached-object edits or stale completion.
  Generic detail-change events no longer replace an open modal and erase unblurred field drafts;
  close/reopen refreshes the view, while completion always re-reads durable state.
  `TASKS.md` writes now use serialized content-hash compare-and-swap, with mtime only as a
  backward-compatible fallback; every newly checked or removed task requires its matching
  completion or deletion receipt. Guarded deletion moves detail to an unserved, unwatched,
  gitignored `.task-detail-tombstones/` path before the board write and treats failed final
  cleanup as a safe warning.
  Task-detail writes carry a
  content revision in live mode and compare exact loaded bytes in static mode, refusing a
  detected stale whole-file save instead of overwriting newer agent evidence. Missing or
  completed tasks reject stale detail writes. Completed tasks are read-only until reopened; both
  the modal and live detail route enforce that boundary so a later contract edit cannot
  invalidate a completion receipt in place.
- External tracker status can no longer justify auto-completion or an agent waiver.

### Behind the scenes
- `README.md`, `CLAUDE.md`, target-repo instruction templates, and board-maintenance nudges now
  teach the same model-neutral state contract.
- `tasks-start` keeps its executable core below 500 lines and moves detailed runtime bootstrap
  mechanics behind a contents-mapped direct reference.
- Claude/Codex manifests and `skills/tasks-start/assets/board-version.json` bumped `1.0.2` →
  `1.1.0`; discovery copy now exposes evidence receipts, attempt ledgers, and bounded convergence.
- No new skills, dashboard UI schema, agents, hooks bundled in the plugin, MCP servers, commands,
  or test framework were added.

## [1.0.2] — 2026-07-23

### Improved
- `tasks-create` now treats "scope a task", "define done", and related prompts as first-class triggers. Non-trivial tasks get explicit in-scope and deferred work, a functional bar, a separate evidence bar, and ownership for costly gates before the verification checklist is authored.
- Ambitious or high-uncertainty work is now decomposed progressively: preserve the full end goal, get the smallest end-to-end version working first, then advance through separately observable hardening and qualification tasks.
- Optional long soaks, exhaustive platform matrices, physical-device checks, external approvals, and similar evidence can no longer become ownerless indefinite gates by accident. The skill surfaces cost and deferral risk to the operator; a deferral is recorded and moved to a separately owned Backlog task instead of remaining an open verification item.
- The shared task-detail contract adds a `Scope` section plus structured functional/evidence/gate-ownership acceptance. Verification remains a hard, waivable gate, and waiving useful evidence now preserves it as linked backlog work.
- Task execution now has a bounded convergence rule: every cycle must produce a pass, concrete failure evidence, or a narrower hypothesis; after two materially identical cycles, the agent records the blocker, checks whether the task needs a smaller working rung, and then changes the experiment, improves observability, returns the gate to its owner, or asks for a decision.
- Suggested target-repo instructions, the authoring guide, plugin discovery copy, and public documentation now teach the same finish-line and convergence contract.

### Behind the scenes
- Bumped the Claude/Codex manifests and portable board marker to 1.0.2, added the missing Claude marketplace description, and regenerated the tracked Codex package from the authoritative root skills.

## [1.0.1] — 2026-07-20

### Improved
- Fresh boards now start with exactly **Backlog → To-Do → Active → Completed**. Existing custom category names and order remain untouched, and legacy **Done** categories retain the same completion gates.
- Category and card drags auto-scroll near overflowing board/card edges, and category reordering now has an explicit final slot before **+ Add Section**.
- The project header now shows a concise live-source path derived from the server's canonical `TASKS.md` location, with the full path and localhost origin available on hover; static mode clearly labels a browser-selected file without pretending the browser exposes its absolute path.

### Fixed
- Category drags and task drags now use distinct typed payloads, preventing one gesture from activating both drop systems and drawing a misleading task insertion line.
- Drop markers are non-layout-shifting overlays positioned at the nearest measured boundary. Full-height category markers and card-edge markers now stay aligned across uneven card heights, scrolling, same-category reorders, cross-category moves, newly created categories, and empty categories.
- Card moves persist relative to a stable neighboring task id instead of a transient numeric index, so the rendered target and the saved order agree.
- Browser-originated writes now broadcast immediately to every other open tab instead of suppressing the only update those sibling tabs needed. Task reads and writes carry a stable board identity, so a long-lived tab refuses to display or mutate another project if its localhost port is ever reused.

### Behind the scenes
- Bumped the manifests and portable board marker to 1.0.1 and regenerated the tracked Codex package.

## [1.0.0] — 2026-07-20

The stable 1.0 task-system contract: every board carries the identity of the project it
actually tracks, and every future agent gets a clear, current map of how to operate it.

### Added
- Durable project-facing board identity through `config.json.boardTitle` plus a generated `board-config.js` companion. `/tasks-start` and `/tasks-update` preserve meaningful titles, backfill only missing/generic legacy values, and reconcile the companion on every run so the same heading and `PROJECT / TASKS / SHAUGHV` tab title work over localhost and `file://`.

### Improved
- The target-repo task-system guidance and `tasks-management` reference now route agents across all seven skills, make `/tasks-create` the preferred path for well-formed milestones/tasks/subtasks, reinforce update and completion discipline, and provide a GitHub `main` fallback when a harness cannot update or may have stale plugin guidance.
- The live dashboard reads the durable title while retaining repo-path identity for multi-board safety; config/identity changes refresh without conflating the display name with the server's absolute-root identity.

### Behind the scenes
- Extended the board-server/reference/removal contracts for the generated identity companion, bumped all manifests and the portable board marker to 1.0.0, and regenerated the tracked Codex package.

## [0.2.2] — 2026-07-17

### Fixed
- `skills/tasks-start/SKILL.md` — existing-board and ancestor-board resumes now pass through the create/repair/upgrade gate before launch instead of skipping directly to the server. The copied board application is a versioned three-file bundle (`dashboard.html`, `board-server.mjs`, `.board-version.json`): every `/tasks-start` compares semantic versions, rolls all members forward together only when the loaded bundle is newer, repairs missing same-version members, reconciles `config.json.pluginVersion` only after a successful copy, and refuses to downgrade a newer shared board. This closes the path that left pre-0.2.1 dashboards without the long-description **Show more / Show less** UI even though the plugin itself was current.
- `skills/tasks-start/assets/board-server.mjs` — installer manifests now read the copied board marker first instead of recording `pluginVersion: "unknown"` outside Claude Code. The shipped offline-asset tier accepts the explicit `SHAUGHV_TASKS_ASSETS_DIR` supplied by `tasks-start`, with Claude/Codex plugin-root variables as compatibility fallbacks, so Claude Code, Codex, and standalone skills.sh installs resolve the same bundle reliably.

### Behind the scenes
- Added `skills/tasks-start/assets/board-version.json` as the portable source bundle marker and extended local/CI version-lockstep validation to cover it; updated the server reference, removal contract, README, and maintainer guidance; regenerated `plugins/shaughv-tasks/`.

## [0.2.1] — 2026-07-09

### Improved
- `skills/tasks-start/assets/dashboard.html` — the read-only **Description** box in the task and milestone detail modals now collapses when it's tall and reveals a **Show more ▾ / Show less ▴** toggle, and its expanded state is a height-capped (`50vh`), independently **scrollable** region. A long description no longer grows unbounded and shoves Subtasks / Verification / Activity down the modal. The toggle only appears when the content actually overflows the collapsed height, so short (TT;DR-only) descriptions render whole with no control; a soft bottom fade hints there's more when collapsed; the expand/collapse choice persists across in-modal re-renders and resets to collapsed on reopen. One shared `mountCollapsibleDesc()` helper drives both modals (they share `.tm-desc-rendered`). Edit mode (the already-resizable textarea) is unchanged.

### Behind the scenes
- `plugins/shaughv-tasks/` regenerated via `build-codex-plugin.ps1`; version lockstep across the three manifests + this changelog.

## [0.2.0] — 2026-07-02

The long-term platform release: milestones, verification checklists, git-tracked shared boards, a secure store, and multi-board safety — the plugin grows from five skills to seven.

### Added
- `skills/tasks-create/SKILL.md` — new user-invocable skill: the guided front door for creating a milestone, task, or subtask, with a categorization decision tree, per-level creation flows, prerequisite/milestone/owner linking, and default-on verification-checklist authoring.
- `skills/tasks-boards/SKILL.md` — new reference skill (multi-board doctrine): how agents find, identity-verify, and talk to the right board when several repos run boards on one machine. Resolve the port from your own repo's `.tasks/.board-server.json`, verify the root via `/api/ping`, treat a foreign board on a port as a busy port — **a port is not an identity**.
- **Milestones** — `.tasks/MILESTONES.md` (one dated milestone per line, `(target YYYY-MM-DD)`, same base-36 ids as tasks, unique across both files) + per-milestone detail files `.tasks/milestones/<id>.md` (TT;DR / Why / Scope / Status / **Completed** archive / Activity). Tasks join with an `(ms #id)` tag. Progress is derived (live done + archived ÷ all children); clearing old Done tasks archives milestone-tagged lines into `## Completed` first so progress never regresses. Board: a collapsible milestone rail with brand-derived progress bars, per-milestone modal (target date, description, child list with jump-to-task, activity), click-to-filter, and delete-with-untag.
- **Verification checklists** — a `## Verification` section in each task detail file (default-on at creation): `[ ]` open / `[x]` passed / `[~]` waived items with `(waived YYYY-MM-DD — <who>: <reason>)` records. **Hard, waivable completion gate**: a task cannot be checked done while any item is open; operators may waive from the board without a reason (stamped), agents must record a reason. Board renders waived items struck-through with the stamp.
- **Owner token** — optional `(owner name)` on task lines (canonical order `(needs …) (ms …) (owner …) #id`), owner chips on cards/list rows, an Owner field in the task modal, and multi-operator conventions (Activity attribution, respect-the-owner, line-local merge guidance) in `tasks-management`.
- **Git-tracked boards** — `/tasks-start` asks ONCE (true initial setup only) whether `.tasks/` is git-tracked (shared) or local, persists the answer in `.tasks/config.json` (`schemaVersion`, `git: tracked|ignored|none`, `hooks`, `pluginVersion`), and never re-asks; legacy boards get the choice inferred and backfilled silently. Tracked mode commits the board app files too (collaborators who clone get a working board with zero plugin install) and points the maintenance hooks at the shared `.claude/settings.json`.
- **Secure store** — always-scaffolded `.tasks/.gitignore` (ignores `secure/` + every runtime file in both modes) and `.tasks/secure/`, the gitignored private tier for API keys, credentials, and personal notes. New secrets policy in `tasks-memory` (env/keychain preferred, reference-by-name-never-inline, shared-vs-personal memory guidance for tracked boards); `tasks-remove` never promotes `secure/` (explicit delete-or-relocate ask).
- `skills/tasks-start/assets/board-server.mjs` — `GET|POST /api/milestones` and `GET|POST|DELETE /api/milestone?id=` (same atomic-write + 409 optimistic-concurrency semantics as their task counterparts), read-only `GET /api/config`, `MILESTONES.md`/`milestones/` file-watching with new SSE kinds (`milestones`, `detail`, `config`), and `secure/` excluded from watching and unreachable from every route.

### Fixed
- **Wrong-board edits on shared ports** — `/api/ping` now returns the board's identity (the absolute `.tasks/` root it serves), and `ensure`/`status` verify that root instead of trusting any board-shaped answer on the remembered port. A stale `.board-server.json` pointing at a port now owned by another repo's board is treated as a busy port and this repo's server starts on the next free one — two agents in two repos can no longer cross-edit through the default port (the incident that motivated `tasks-boards`).
- `skills/tasks-start/assets/dashboard.html` — detail-file round-trip was lossy: everything after `## Activity` that wasn't a `- ` line was silently dropped on save. The new section-aware parser preserves every unknown `## ` section verbatim in its original position, and never emits an empty `## Verification` (pre-0.2.0 files stay byte-stable).

### Improved
- `skills/tasks-management/SKILL.md` — rewritten as the full three-level contract: milestone → task → subtask, the extended task-line grammar, milestone formats + templates, the completion gates ("Done with X" works prerequisites → subtasks → verification in order; new "Done with a milestone" verb), at-risk milestone surfacing, and multi-operator conventions.
- `skills/tasks-start/SKILL.md` — scaffolds the new files (MILESTONES.md, milestones/, config.json, .tasks/.gitignore, secure/ + the CLAUDE.md secrets pointer line); board asset copy is now **upgrade-only** (never downgrades a shared board's committed app files); resume reads config.json and repairs older installs additively; the orientation/report templates resolve the real port from `.board-server.json` instead of assuming 4317.
- `skills/tasks-update/SKILL.md` — milestone-aware triage (at-risk = past target with open children), verification-aware external sync (never auto-complete over open checks), the Done-clearing archive step, and a tracked-mode offer to commit board changes.
- `skills/tasks-remove/SKILL.md` — migrates open milestones into `## Open threads` (grouped with their open children), removes the root `.gitignore` line only when `config.json` says `ignored`, and handles `secure/` explicitly.
- `skills/tasks-start/references/board-server.md` — documents the extended grammar, the MILESTONES.md contract, the new endpoints and SSE kinds, the three-state verification syntax and gate semantics, `config.json`/`secure/` boundaries, ping-as-identity, and the honest-rendering rule (hand-edited violating states render with a warning chip, never auto-corrected).
- `skills/tasks-start/assets/dashboard.html` — SHAUGHV brand pass on new and touched surfaces: design tokens (`--hairline`, square radii, brand easings/durations), inline Lucide SVGs replace the ☑/🔒 emoji everywhere, the "just-changed" pulse loses its spring easing and shadow ring (outline + brand cubic instead), and lightweight micro-interactions land across the board — milestone progress bars sweep from their previous value, counts roll through the Slot Roll, refused actions get a short honest shake, the verification section spotlights itself when it blocks completion. The tab title and header show the board's repo name so two boards on one machine are distinguishable at a glance. All new controls are real buttons with `aria-expanded`/`aria-label`, and `prefers-reduced-motion` is honored.

### Behind the scenes
- `plugins/shaughv-tasks/` regenerated via `build-codex-plugin.ps1`; version lockstep across the three manifests + this changelog; README/CLAUDE.md/AGENTS.md updated for the seven-skill surface.

## [0.1.2] — 2026-06-26

### Improved
- `skills/tasks-management/SKILL.md` — clarified the three-way task breakdown contract: parent task descriptions are for handoff context and reasoning, proper subtasks are the dashboard/modal checkbox items stored as indented rows in `TASKS.md`, and larger dependent work should be separate top-level tasks linked with `(needs #id)`.
- `skills/tasks-start/SKILL.md` — `/tasks-start` now checks the target repo's root `CLAUDE.md` and `AGENTS.md` on setup/resume and adds or offers a concise "Task management system" section so future agents know which `tasks-*` skills to use and how to keep `.tasks/` current.
- `skills/tasks-start/assets/dashboard.html` — modal subtasks now support their own optional descriptions, stored as indented blockquote-style continuation lines under each subtask in `TASKS.md` and round-tripped through the live board.
- `skills/tasks-start/assets/dashboard.html` — marking a task done or moving it into Done is blocked while prerequisites or proper subtasks remain unfinished, so visible subtasks count as real work.
- `README.md` and `skills/tasks-start/references/board-server.md` — documented UI-backed subtasks, subtask descriptions, and the corrected `TASKS.md` serialization contract.

### Fixed
- `skills/tasks-management/SKILL.md` — fixed the prerequisite example so `(needs …)` appears before the trailing task id, matching the documented "id LAST" rule.

## [0.1.1] — 2026-06-26

### Fixed
- `.agents/plugins/marketplace.json` — changed the Codex marketplace policy from unsupported `authentication: NONE` to the accepted `authentication: ON_INSTALL`, so `codex plugin marketplace add RealEmmettS/shaughv-tasks` can ingest the marketplace cleanly. The Claude Code plugin surface is unchanged apart from the matching patch version bump.

## [0.1.0] — 2026-06-25

Initial release. The five SHAUGHV `tasks-*` skills — previously bundled inside [`shaughv-code`](https://github.com/RealEmmettS/shaughv-code) — extracted into their own standalone, dual-surface (Claude Code + Codex) plugin so the task + workplace-memory system is installable on its own in any agent.

### Added
- `skills/tasks-start`, `skills/tasks-update`, `skills/tasks-management`, `skills/tasks-memory`, `skills/tasks-remove` — the full task + workplace-memory system, lifted byte-for-byte from `shaughv-code` (including `tasks-start`'s `assets/board-server.mjs`, `assets/dashboard.html`, and the 8 sha256-pinned `assets/vendor/**` board assets).
- `.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json` — the Claude Code plugin + single-plugin marketplace manifests, `v0.1.0`, scoped to task management.
- `.codex-plugin/plugin.json` + `.agents/plugins/marketplace.json` — the Codex plugin manifest (skills-only, **no `mcpServers`**) and Codex marketplace entry (`path: ./plugins/shaughv-tasks`; authentication policy fixed to `ON_INSTALL` in `0.1.1`).
- `build-codex-plugin.ps1` — regenerates the tracked Codex package `plugins/shaughv-tasks/` (manifest + `skills/` copied verbatim; no `.mcp.json` to wrap, since this bundle ships no MCP servers). `-Check` validates the committed package is in sync and byte-exact.
- `.github/workflows/validate.yml` — CI: JSON-validate the four manifests + the package manifest, `build-codex-plugin.ps1 -Check`, and version lockstep across the three manifests + CHANGELOG.
- `.gitattributes` — pins `skills/tasks-start/assets/vendor/**` (root + Codex mirror) as `binary` so the sha256-pinned board assets stay byte-exact across OS checkout.
- `CLAUDE.md`, `AGENTS.md`, `README.md` — maintainer + consumer documentation for all three install paths.

### Changed (relative to the skills as they shipped in shaughv-code)
- `skills/tasks-start/SKILL.md` — **guaranteed persistence scaffolding**: a fresh `/tasks-start` now writes the `.tasks/CLAUDE.md` working-memory skeleton (with a `<!-- tasks-bootstrap: pending -->` marker) and the `.tasks/memory/` tree (`glossary.md` + `people/`, `projects/`, `context/`) in step 2 — *before* the interactive memory bootstrap — so a persistent memory + config skeleton exists even if setup is interrupted. The first-run gate now keys off the marker; the resume path reads each **Active** task's `.tasks/tasks/<id>.md` (`## Status` + latest `## Activity`) and leads with "where we left off."
- `skills/tasks-management/SKILL.md` — reinforced that an Active task must keep its `## Status` ("exactly where to resume") and `## Activity` log current *as work happens*, since the task list is the cross-session continuity layer that a future session reads to resume.
- `skills/tasks-remove/SKILL.md` — strips the internal `<!-- tasks-bootstrap: … -->` marker when promoting `.tasks/CLAUDE.md` into the repo's root `CLAUDE.md`.
- `skills/tasks-start/assets/dashboard.html` — enlarged the header SHAUGHV brand mark.
- `tasks-management`, `tasks-update`, `tasks-start`, `tasks-remove` — references to `ttdr` / `personal-productivity` / `iterative-plan` / `git-workflow` (which live in the companion `shaughv-code` plugin) reworded to "use the `X` skill **if installed**; otherwise <inline fallback>" so the bundle stands alone.
