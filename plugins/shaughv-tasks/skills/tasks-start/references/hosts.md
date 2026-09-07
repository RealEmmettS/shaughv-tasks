# Codex and Claude Code

The seven skills share one file format and one `.tasks/` folder. Detect the current host
from the running environment; never infer it from `.tasks/CLAUDE.md`. That filename is a
compatibility name for common workplace memory, read explicitly by both hosts.

## Instructions and invocation

In Codex, select `shaughv-tasks:tasks-start` from the skills picker or ask for `tasks-start`
by name. The installed plugin exposes all seven skills with that namespace. In Claude Code use
`/shaughv-tasks:tasks-start` if the short `/tasks-start` name is not exposed. The same rule
applies to the other user-invocable skills. Resolve supporting assets relative to the
loaded SKILL.md; only Claude Code may use CLAUDE_PLUGIN_ROOT as a fallback.

Codex reads the effective root `AGENTS.override.md` if present, otherwise `AGENTS.md`.
Claude Code reads root `CLAUDE.md`. Preserve existing instructions and put this explicit
pointer in each applicable task-system section:

> Before task work, read `.tasks/CLAUDE.md` for shared workplace context, then
> `.tasks/TASKS.md` and the active task's `.tasks/tasks/<id>.md`. Read deeper
> `.tasks/memory/` files only as needed. `.tasks/CLAUDE.md` is shared data; it does not
> replace this host's root instructions.

Do not duplicate the hot cache into competing per-host memory files.

## Optional native hooks

Record choices under `config.json.hosts`, preserving unknown fields and legacy `hooks`:

```json
{
  "hosts": {
    "codex": { "hooks": "declined" },
    "claude": { "hooks": "enabled", "target": ".claude/settings.local.json" }
  }
}
```

Valid recorded states are `enabled`, `declined`, and `unavailable`. No entry means the
host has not been configured. Ask once for the active host only, unless the user has
already requested hooks for both. Persist a decline. Resume never re-asks a recorded
choice. An unavailable host stays manual until the user requests setup again.
Legacy `hooks: local|shared` records placement, not consent. Infer enabled only from
positively identified installed board hooks; never install a missing hook from that
legacy value alone. Record the actual native target and the generated command strings
as `commands` in that host's entry after a successful merge.

Generate a reviewable JSON block with:

```text
node .tasks/board-hooks.mjs codex
node .tasks/board-hooks.mjs claude
```

The generator only prints configuration. Its command embeds a readable Node bridge,
with no machine-specific absolute path or shell variable expansion. The bridge reads
the host's JSON `cwd`, walks to the nearest ancestor board, and launches that board's
server with the original input. It works from a nested shell directory and with spaces
in paths. A payload outside a board produces no action. Missing or invalid `cwd` fails
closed. Node must be on the hook process's PATH.

### Codex

Use repo-local `.codex/hooks.json`. If the same configuration layer already defines
inline hooks in `.codex/config.toml`, merge into that existing inline source instead.
Codex merges sibling JSON and inline hooks and warns; use one representation per layer
to avoid duplicates. Preserve all unrelated TOML. On a local-only board, ignore only a
newly created dedicated hook file via `.git/info/exclude`; never ignore a pre-existing
shared config. If hooks must share an already tracked inline configuration, explain
the placement conflict and get the user's choice before adding personal settings.

The project config layer must be trusted before Codex discovers its hooks. Codex then
requires native hook review/trust through `/hooks`. Leave those reviews to the user;
do not edit approval stores or claim the hooks are active before trust. Record
`pendingReview: true` until native acceptance is observed. Unsupported hosts stay manual.
See [Codex hooks](https://learn.chatgpt.com/docs/hooks).

### Claude Code

Use `.claude/settings.json` for a tracked board, otherwise
`.claude/settings.local.json`; honor an existing recorded target or explicit override.
Merge the generated block and retain permissions, tools, and all unrelated hooks.

### Events and host boundary

Both blocks use SessionStart, PostToolUse for Bash commits/pushes, and SubagentStart/Stop.
Only Claude's PostToolUse matcher includes ExitPlanMode. Codex's `update_plan` is not
an approval event; an approved plan is captured from the actual user conversation.
SessionStart emits plain context; the other events emit `hookSpecificOutput` with
`additionalContext`. The existing server owns cooldowns and board identity checks.

### Merge, repair, remove

Back up a settings file before changing it. Merge individual command entries within each
event; never replace an event array. Skip identical entries. On upgrade, replace only
commands previously recorded for this host, legacy commands containing
`board-server.mjs hook`, or generated bridge commands ending in
`-- shaughv-tasks-board-v1 <host> <event>` and containing the board bridge. Keep sibling
commands even when they share a matcher. Only prune containers made empty by our removal.
Persist `enabled` and exact command ownership after readback; a failed write must not
record success. A recorded decline overrides old placement defaults.

On teardown inspect both Claude settings files and the recorded Codex source, plus
`.codex/hooks.json` and inline hooks if present. Remove only identified board commands.
Do not remove another plugin's hooks, native trust records, config files with unrelated
content, or user instructions outside the task-system section. Remove a matching local
exclude line only if this setup recorded adding it. See `tasks-remove` for data migration.
