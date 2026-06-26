# Changelog

All notable changes to this plugin are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

A plain-English companion lives at [HUMAN_CHANGELOG.md](./HUMAN_CHANGELOG.md) and is kept in lockstep with this file — see the changelog rule in [CLAUDE.md](./CLAUDE.md).

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
