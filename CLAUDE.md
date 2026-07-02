# CLAUDE.md — shaughv-tasks

This is Emmett's standalone task + workplace-memory plugin. The README is for users
installing it; this file is for you, future Claude, when editing it.

## What this repo is

A focused, **skills-only** plugin: the seven SHAUGHV `tasks-*` skills (grown from the five
lifted out of the larger `shaughv-code` bundle) so the task system is installable on its
own in any agent.
The entire purpose is to be a single editable source of truth for the task + workplace-
memory system across all of Emmett's instances.

It ships **no MCP servers and no slash-command files.** The `/tasks-*` entry points are
user-invocable *skills* (Claude Code / Codex surface a user-invocable skill as a slash
command automatically). The live board is a zero-dependency Node HTTP server that the
`tasks-start` skill launches in the target repo — it is **not** an MCP server.

Don't introduce `agents/`, `hooks/`, MCP servers, or `commands/` unless Emmett explicitly
asks to expand scope.

> Note: that rule is about **bundling those things in the plugin itself**. It is NOT
> violated by a skill that writes hooks into a *target* repo when run. The `tasks-*` skills
> do exactly this: `/tasks-start` ships a zero-dependency Node board server
> (`skills/tasks-start/assets/board-server.mjs`) and offers to wire board-maintenance hooks
> into the **target repo's** `.claude/settings*.json`; `/tasks-remove` tears both back down.
> Those hooks live in whatever repo the skill is run in — never in this plugin.

## The seven skills

| Skill | Role |
|---|---|
| `tasks-start` | Stands up `.tasks/` (TASKS.md, MILESTONES.md, working memory, deep memory, `secure/`, `config.json`, dashboard), asks ONCE whether the board is git-tracked or local (persisted to `config.json`, never re-asked), launches the live board, bootstraps memory. The only skill that carries assets. |
| `tasks-create` | Guided creation: milestone vs task vs subtask categorization, linking (`(needs …)` / `(ms …)` / `(owner …)`), default-on verification-checklist authoring. |
| `tasks-update` | Syncs tasks from a connected tracker, triages stale items + at-risk milestones, archives cleared milestone work (progress never regresses), fills memory gaps. |
| `tasks-management` | Reference (`user-invocable: false`) — the full contract: TASKS.md + MILESTONES.md formats, milestone → task → subtask hierarchy, verification checklists (`[ ]`/`[x]`/`[~]` waived, reasons required for agent waivers), completion gates, multi-operator conventions. |
| `tasks-memory` | Reference (`user-invocable: false`) — the two-tier `.tasks/CLAUDE.md` + `.tasks/memory/` model, the secrets policy, and the `secure/` private tier. |
| `tasks-boards` | Reference (`user-invocable: false`) — multi-board machines: resolve this repo's board from its own `.board-server.json`, verify identity via `/api/ping` root, never trust a port. |
| `tasks-remove` | Decommissions the system, folds memory + open milestones back into the repo's own `CLAUDE.md` + `memory/`, handles `secure/` explicitly (never promoted), deletes `.tasks/`. |

## Persistence model (the point of this plugin)

Tasks and memory are **persistent across sessions**. `/tasks-start` is idempotent — re-run
it days later and it reloads the existing `.tasks/` and resumes. The **task list itself is
the continuity layer**: the Active column shows what's in flight, each task's
`.tasks/tasks/<id>.md` carries a `## Status` ("exactly where to resume") and a timestamped
`## Activity` log, and on resume `tasks-start` reads those and leads with "here's where we
left off." A fresh `/tasks-start` always scaffolds the memory tree + config up front (even
before the interactive bootstrap), so a persistent skeleton exists no matter what. Keep that
property intact when editing — it's why the plugin exists.

## Cross-references to shaughv-code skills

A few task skills softly reference skills that live in the companion `shaughv-code` plugin
(`ttdr`, `personal-productivity`, `iterative-plan`, `git-workflow`). Each is worded as "use
the `X` skill **if installed**; otherwise <inline fallback>" so nothing hard-depends on
shaughv-code being present. Keep new cross-references degradation-safe the same way.

## Editing a skill

- Edit `skills/<name>/SKILL.md` directly. No `.skill` zip, no build step for the Claude
  surface.
- After editing root skills or `.codex-plugin/plugin.json`, regenerate the Codex package:
  `pwsh ./build-codex-plugin.ps1` (verify with `-Check`), and commit the regenerated
  `plugins/shaughv-tasks/` too.
- CI (`.github/workflows/validate.yml`) re-runs `build-codex-plugin.ps1 -Check`, validates
  every JSON manifest, and checks version lockstep on every PR and push to `main` — so a
  forgotten regeneration or a drifted package can't land on `main` unnoticed. CI
  **validates**; it does not regenerate the package for you.
- Changes propagate to every Claude instance via `/plugin marketplace update`, to Codex via
  `codex plugin marketplace upgrade shaughv-tasks`, and to `npx skills` installs via
  `npx skills update`.

## The Codex surface

Codex installs a marketplace plugin by snapshotting a self-contained **subdirectory** named
by the marketplace entry — it can't consume this repo's flat root (which must stay flat for
Claude Code). So the Codex surface is a tracked, generated package:

- **`plugins/shaughv-tasks/`** — generated copy of root `.codex-plugin/plugin.json` + a copy
  of `skills/`. **Never hand-edit it.** Regenerate with `pwsh ./build-codex-plugin.ps1`.
- **`.agents/plugins/marketplace.json`** — the Codex marketplace entry; its source path is
  `./plugins/shaughv-tasks` (a subdirectory, not the repo root).
- **`.codex-plugin/plugin.json`** — the Codex manifest (source of truth, copied verbatim into
  the package). Points at `./skills/`. Carries **no** `mcpServers` key — skills-only.
- Unlike shaughv-code there is **no `.mcp.json` and no `.codex/config.toml`** (nothing to wrap
  or fall back to), so the build script just copies the manifest + skills verbatim.

## Bumping the version

Bump the same version in all three manifests + add a CHANGELOG entry, in one commit:
1. `.claude-plugin/plugin.json`
2. `.claude-plugin/marketplace.json`
3. `.codex-plugin/plugin.json`
4. `CHANGELOG.md` (new `## [x.y.z]` heading) + `HUMAN_CHANGELOG.md` (lockstep — see below)
5. Regenerate the Codex package: `pwsh ./build-codex-plugin.ps1`.

CI fails the push if these four versions disagree.

## Changelog rule

Two changelogs in parallel: `CHANGELOG.md` (technical, Keep a Changelog, semver) and
`HUMAN_CHANGELOG.md` (plain-English companion — no versions, no paths, no jargon). Every
release in one has a matching section in the other. Whenever you bump `version`, update BOTH
in the same commit, using the category labels **Added**, **Improved**, **Fixed**, **Removed**,
**Security**, **Behind the scenes**. Purely internal changes still get a one-line **Behind the
scenes** note. (The `human-changelog` skill in `shaughv-code` encodes the full translation
rules if you need a refresher.)

## Quirks to leave alone

- The `skills/` directory MUST stay lowercase. Case-only renames on Windows need a two-step
  `mv` (e.g. `mv skills tmp && mv tmp skills`).
- `skills/tasks-start/assets/vendor/**` is pinned `binary` in `.gitattributes` (root + the
  Codex mirror). Those 8 files are sha256-verified by `board-server.mjs` at install time and
  byte-compared by `build-codex-plugin.ps1 -Check`; never let an editor or EOL normalization
  touch them.
- `board-server.mjs` and `dashboard.html` resolve their own paths at runtime from the
  `.tasks/` folder; the only plugin-root coupling is `CLAUDE_PLUGIN_ROOT` (used for the
  offline bundled-font tier). It keeps the skill name `tasks-start`, so
  `<root>/skills/tasks-start/assets/...` stays valid.

## What not to do

- Don't hand-edit `plugins/shaughv-tasks/` — it's generated. Edit root content and re-run
  `build-codex-plugin.ps1`.
- Don't add MCP servers, commands, or a `.mcp.json` without an explicit ask — this bundle is
  deliberately skills-only.
- Don't write tests. The skills are documentation/prompts; the meaningful checks are
  `build-codex-plugin.ps1 -Check`, manifest validation, and `claude --plugin-dir <path>` +
  seeing a skill trigger on its phrases and the board come up.
