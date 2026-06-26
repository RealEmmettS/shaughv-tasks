# AGENTS.md — shaughv-tasks

This is Emmett's standalone task + workplace-memory Codex plugin. The README is for users
installing it; this file is for you, future Codex, when editing it.

## What this repo is

A focused, **skills-only** plugin: the five SHAUGHV `tasks-*` skills, extracted from the
larger `shaughv-code` bundle so the task system can be installed on its own. It is the single
editable source of truth for the task + workplace-memory system across all of Emmett's
agents.

It ships **no MCP servers and no slash-command files.** The `/tasks-*` entry points are
user-invocable *skills* (Codex surfaces a user-invocable skill as a slash command
automatically). The live board is a zero-dependency Node HTTP server launched by the
`tasks-start` skill in the target repo — not an MCP server.

Don't introduce `agents/`, `hooks/`, MCP servers, or `commands/` unless Emmett explicitly
asks to expand scope.

> Note: that rule is about **bundling those things in the plugin**. A skill that writes hooks
> into a *target* repo when run does not violate it. `/tasks-start` ships
> `skills/tasks-start/assets/board-server.mjs` and offers to wire board-maintenance hooks into
> the **target repo's** `.claude/settings*.json`; `/tasks-remove` removes both. Those hooks
> live in the target repo, never in this plugin.

The bundle is consumable three ways: (1) the Claude Code marketplace install in the README,
(2) the Codex marketplace install in the README, and (3) `npx skills add RealEmmettS/shaughv-tasks`
for a skills-only install in any [skills.sh](https://skills.sh)-supported agent. Root content
— `skills/`, `.codex-plugin/plugin.json` — is the authoring source of truth; the Codex surface
is a generated copy of it (see "Codex plugin surface").

## Codex plugin surface

Codex installs a marketplace plugin by snapshotting a self-contained plugin **subdirectory**
named by the marketplace entry — it cannot consume this repo's flat root (which must stay flat
for Claude Code). So the Codex surface is a tracked, generated package:

- **`plugins/shaughv-tasks/`** is the self-contained Codex package — a generated copy of root
  `.codex-plugin/plugin.json` and a copy of `skills/`. **Never hand-edit it.** Regenerate from
  root with `pwsh ./build-codex-plugin.ps1` (validate with `-Check`).
- **`.agents/plugins/marketplace.json`** is the Codex marketplace entry. Its source is
  `{ "source": "local", "path": "./plugins/shaughv-tasks" }` — a subdirectory, not the repo
  root (Codex does not list a plugin whose local source path is the marketplace root itself).
  `authentication` is `NONE` (no OAuth-gated MCP to authenticate).
- **`.codex-plugin/plugin.json`** is the Codex manifest (source of truth, copied verbatim into
  the package). Keep it lowercase. It points at `./skills/` and carries **no** `mcpServers`
  key — this surface is skills-only.
- **No `.mcp.json` and no `.codex/config.toml`.** This bundle has no MCP servers, so — unlike
  shaughv-code — there is nothing to wrap or to fall back to, and the build script just copies
  the manifest + skills verbatim.
- The Claude marketplace surface lives in `.claude-plugin/`; don't rename or remove it when
  editing the Codex surface.

## Editing a skill

- Edit `skills/<name>/SKILL.md` directly. No `.skill` zip to rebuild.
- Regenerate the Codex package after any change to root `skills/` or `.codex-plugin/plugin.json`:
  `pwsh ./build-codex-plugin.ps1` (verify with `-Check`). Commit the regenerated
  `plugins/shaughv-tasks/` alongside the root change; never hand-edit the package. CI
  (`.github/workflows/validate.yml`) re-runs `build-codex-plugin.ps1 -Check`, validates the JSON
  manifests, and checks version lockstep on every PR and push to `main`.
- Changes propagate to Codex via `codex plugin marketplace upgrade shaughv-tasks` and
  `codex plugin add shaughv-tasks@shaughv-tasks` after the commit is pushed; to Claude Code via
  `/plugin marketplace update`; to `npx skills` installs via `npx skills update`.

## Adding a skill

1. Create `skills/<kebab-name>/SKILL.md` with frontmatter (`name:` MUST match the directory
   name; keep `description` under 1024 chars). Supporting docs in `references/`, code in
   `examples/`, assets in `assets/`.
2. Bump `version` in all three manifests (`.codex-plugin/plugin.json`,
   `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`).
3. Regenerate the Codex package: `pwsh ./build-codex-plugin.ps1`.
4. Add a release entry to both changelogs (see the Changelog rule below).

## Changelog rule

Two changelogs in parallel — `CHANGELOG.md` (technical, Keep a Changelog, semver) and
`HUMAN_CHANGELOG.md` (plain-English, no versions/paths/jargon). Every release in one has a
matching section in the other; whenever you bump `version` you MUST update both in the same
commit, using the labels **Added**, **Improved**, **Fixed**, **Removed**, **Security**,
**Behind the scenes**. Purely internal changes still get a one-line **Behind the scenes** note.

## Quirks to leave alone

- The `skills/` directory MUST stay lowercase. Case-only renames on Windows need a two-step
  `mv` (e.g. `mv skills tmp && mv tmp skills`).
- `.gitattributes` pins `skills/tasks-start/assets/vendor/**` (and its Codex mirror) as
  `binary` so the 8 sha256-pinned board assets stay byte-exact across OS checkout and pass the
  `build-codex-plugin.ps1 -Check` byte-compare. Nothing in this mirror is *generated* text
  (manifest + skills are copied verbatim), so — unlike shaughv-code — no `.mcp.json text eol=lf`
  pin is needed.

## What not to do

- Don't recreate `.skill` zip bundles.
- Don't hand-edit `plugins/shaughv-tasks/` — it's generated. Edit root content and re-run
  `build-codex-plugin.ps1`.
- Don't add MCP servers, commands, or a `.mcp.json` without an explicit ask.
- Don't write tests. The useful checks are `build-codex-plugin.ps1 -Check`, manifest
  validation, Codex marketplace discovery, and seeing a skill trigger on its phrases.
