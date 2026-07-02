# Changelog

All notable changes to this plugin are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

A plain-English companion lives at [HUMAN_CHANGELOG.md](./HUMAN_CHANGELOG.md) and is kept in lockstep with this file — see the changelog rule in [CLAUDE.md](./CLAUDE.md).

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
