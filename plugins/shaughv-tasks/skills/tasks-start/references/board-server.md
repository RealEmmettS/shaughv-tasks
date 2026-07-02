# board-server.mjs — the live localhost board + maintenance hooks

`board-server.mjs` ships in `skills/tasks-start/assets/` and is copied into `.tasks/`
by `/tasks-start`. It is the single source of truth for how the live board runs and how
the board-maintenance hooks are wired into a target repo. **`/tasks-start` and
`/tasks-remove` must follow this file verbatim** so the install string and the teardown
match string never drift apart.

It uses **only Node built-ins** — no `npm install`, no build step. It requires `node` on
PATH; if Node is absent, fall back to the legacy `file://` dashboard flow (open
`dashboard.html` from a file browser and use the Select-file pickers).

## Subcommands

Run from the repo root (the `.tasks/` folder is a child of it):

| Command | What it does |
|---|---|
| `node .tasks/board-server.mjs serve [--open] [--port N]` | Start the server in the foreground. `--open` opens the browser once it's listening. |
| `node .tasks/board-server.mjs ensure [--open]` | Start the server **detached** (survives the calling process) only if it isn't already running. Used by the relaunch path and by hooks. |
| `node .tasks/board-server.mjs hook <EVENT>` | Ensure the server is up, then print the right board-maintenance nudge for `<EVENT>`. Reads the hook's JSON payload from stdin. |
| `node .tasks/board-server.mjs stop` | Stop a running server and clear its state files. |
| `node .tasks/board-server.mjs status` | Print `{port,pid,...}` if running, else `{"running":false}`. |
| `node .tasks/board-server.mjs install [--tier T] [--offline] [--no-global] [--json] [--node-bootstrap M:id]` | **Internal, NOT user-invocable.** Provision the tiered display assets into `.tasks/vendor/` and write `.install-manifest.json`. Run by `/tasks-start` after copying assets, before `serve`. See [Tiered dependencies](#tiered-dependencies). |

To launch + open the board (what `/tasks-start` does): `node .tasks/board-server.mjs ensure --open`.

## How it serves and live-syncs

- Default port **4317**; if busy it picks the next free port and records the choice in
  `.tasks/.board-server.json` (`{port, pid, startedAt}`). "Is it running?" is verified by
  hitting the `/api/ping` health endpoint, not just a PID-alive check — so a dead/reused
  PID never fools it.
- **Ping is an identity check, not just a liveness check.** `/api/ping` reports the
  absolute path of the `.tasks/` folder the server serves (its **root**) alongside the
  `shaughv-task-board` token. `ensure` only treats a responder as "already running" when
  the root matches *this* board's `.tasks/` — a different root means **another repo's
  board holds the port**, which is handled as a busy port: this board starts on the next
  free port. `status` prints the root too. Multiple boards on one machine is a supported,
  normal setup; agents must resolve ports from their own repo's state file and verify the
  root before writing through any API (full rules: the `tasks-boards` skill).
- HTTP API (the server stays **dumb** about markdown — the browser keeps all parse/serialize):
  - `GET /` → serves `dashboard.html`.
  - `GET /api/tasks` → raw `TASKS.md`; response carries `X-Board-Mtime`.
  - `POST /api/tasks` → atomic write. Send `X-Base-Mtime` (the mtime you loaded); if the
    file changed underneath you the server returns **409** with the latest content, so an
    agent's write is never silently stomped.
  - `GET|POST /api/milestones` → raw `MILESTONES.md`, exactly the same semantics as
    `/api/tasks` (mtime header, 409-with-latest, atomic write). GET returns the
    `# Milestones` skeleton when the file doesn't exist yet; the file is only created on
    first write.
  - `GET|POST|DELETE /api/milestone?id=<id>` → a milestone's rich detail file at
    `.tasks/milestones/<id>.md`, exactly the same semantics as `/api/task?id=` (same
    `^[0-9a-z]{2,8}$` id validation, lazy files, atomic writes, delete-with-the-milestone).
  - `GET /api/config` → raw `.tasks/config.json` bytes (`{}` if missing). **Read-only** —
    the server never parses or writes it; setup (`/tasks-start`) owns it.
  - `GET /api/events` → **SSE**; a `change` event fires when board state changes on disk,
    with a `kind` of `tasks`, `milestones`, `config`, or `memory` so the browser reloads
    the right surface. Implemented with `fs.watchFile` on `TASKS.md` and `MILESTONES.md`
    (reliable cross-platform) plus a best-effort recursive `fs.watch`. **`secure/` is
    excluded from watching** — edits there never produce events.
  - `GET|POST /api/memory/tree`, `/api/memory/file?path=` → memory tab; writes are
    path-guarded to `CLAUDE.md` or `*.md` under `memory/` (traversal / absolute / non-`.md`
    / symlink-escape all rejected).
  - `GET|POST|DELETE /api/task?id=<id>` → a task's rich detail file at `.tasks/tasks/<id>.md`
    (the description + activity log behind the dashboard's task modal). `id` is validated
    `^[0-9a-z]{2,8}$` (the task's trailing `#id`). GET returns the raw markdown (empty string
    if the file doesn't exist yet — detail files are lazy/optional); POST atomically writes it;
    **DELETE removes it** (the dashboard calls DELETE when a task is deleted, so a reused id
    can't inherit stale detail). All three set `lastSelfWrite` so the write doesn't echo back
    over SSE.
  - `GET /vendor/*` → static read of a provisioned display asset from `.tasks/vendor/`
    (anime.js, the brand woff2s, the brand mark, `fonts.css`). Same path confinement as the
    memory API (`path.resolve` under `vendor/`, traversal / NUL / drive-escape → 403; encoded
    `..` is also neutralised by URL normalisation). Binary-safe (`res.end(buffer)`), correct
    MIME per extension, `Cache-Control: public, max-age=3600`. A missing file 404s so the
    dashboard's runtime loader falls through to its CDN / inline fallback. See
    [Tiered dependencies](#tiered-dependencies).
- `dashboard.html` auto-detects: over `http(s)` it uses this API + SSE; over `file://` it
  uses the legacy File System Access API. One file, both modes.
- Auto-open is **only** on the explicit `/tasks-start` launch (`ensure --open`). Hooks call
  `ensure` **without** `--open`, so they revive the server silently and never pop a browser
  tab every session.

## The board-maintenance hooks (written into the TARGET repo)

`/tasks-start` offers (ask once, suggest yes) to merge this block into the target repo's
Claude settings. The target file follows the git choice recorded in `.tasks/config.json`:
**`.claude/settings.json`** when `"git": "tracked"` (the reminder is worth sharing with
everyone on the shared board), **`.claude/settings.local.json`** when `"git"` is
`"ignored"` or `"none"` (personal, gitignored). The operator can override; record the
actual target as `config.json` `"hooks"` (`"shared"` / `"local"`):

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [ { "type": "command", "command": "node .tasks/board-server.mjs hook SessionStart" } ] }
    ],
    "PostToolUse": [
      { "matcher": "Bash|ExitPlanMode", "hooks": [ { "type": "command", "command": "node .tasks/board-server.mjs hook PostToolUse" } ] }
    ],
    "SubagentStart": [
      { "hooks": [ { "type": "command", "command": "node .tasks/board-server.mjs hook SubagentStart" } ] }
    ],
    "SubagentStop": [
      { "hooks": [ { "type": "command", "command": "node .tasks/board-server.mjs hook SubagentStop" } ] }
    ]
  }
}
```

What fires when (verified against the Claude Code hooks doc):
- **SessionStart** (no matcher → also re-fires on resume / `/clear` / after compaction):
  ensures the board is alive and injects the standing "keep `.tasks/TASKS.md` current"
  reminder. Plain stdout is injected as agent-visible context for this event.
- **PostToolUse** `Bash|ExitPlanMode`: matchers filter on **tool name only**, so the script
  reads `tool_input.command` from stdin and nudges (agent-visible `additionalContext`) ONLY
  on `git commit` / `git push`; an `ExitPlanMode` tool call triggers the "mirror the plan"
  nudge. Any other Bash command produces no output.
- **SubagentStart / SubagentStop** (match all agent types): nudge when a subagent spawns /
  finishes, via `additionalContext`.

Nudges are de-duped **per semantic type** (`commit`, `push`, `plan`, `subagent-start`,
`subagent-stop`) with a 30s cooldown — so a commit nudge never swallows a later push nudge,
and a subagent fan-out can't spam. `SessionStart` is never cooled down.

The command path is **relative** (`.tasks/board-server.mjs`) on purpose: it's shell-agnostic
(no env-var expansion that would differ between Git Bash and PowerShell) and resolves when
the hook runs from the repo root (Claude Code's default). If a hook ever fires from another
directory, `node` simply won't find the script and the hook no-ops — a safe implicit gate.
The script also hard-gates on `.tasks/dashboard.html` existing before doing anything.

### Merge rule (install)

Read the settings file if it exists (else start from `{}`), **preserve every existing key
and hook**, and append only the entries above (create each event array if absent). Never
clobber unrelated hooks.

### Teardown match (used by /tasks-remove)

Every command we add contains the stable marker **`board-server.mjs hook`**. To remove the
hooks, delete from `.claude/settings.local.json` (and `.claude/settings.json` — check both)
ONLY the hook entries whose `command` contains that marker; prune any array that becomes
empty, then `hooks` if it becomes empty, then the file if it becomes `{}`. Never remove a
hook you can't positively identify by the marker. Also run `node .tasks/board-server.mjs
stop` to kill the running server before deleting `.tasks/`.

## TASKS.md format contract (server ↔ dashboard must agree)

The dashboard parses/serializes this exact shape; the server only moves the bytes:

```markdown
# Tasks

## Backlog

## To-Do
- [ ] **Task title** - optional note (needs #b2c) (ms #k7p) (owner emmett) #a3f
  - [x] subtask
    > optional subtask detail

## Active
- [ ] **Other task** #b2c

## Done
- [x] **Done task** #x9z
```

- `## Section` headers (optional `**bold**`); section id = lowercased, non-alnum → `-`.
  Default columns are **Backlog → To-Do → Active → Done** (file order = column order).
- Task lines: `- [ ]` / `- [x]`, a **bold** title, optional ` - note`, optional
  ` (needs #id, #id)` prerequisites, optional ` (ms #id)` milestone tag, optional
  ` (owner name)`, then the task's own short base-36 ` #id` LAST.
- **The task's own id is the bare trailing `#id`** — ids inside parentheses (`(needs #b2c)`,
  `(ms #k7p)`) are references and must be excluded from the trailing-id scan. Never write a
  naive "last `#token` wins" parser.
- `(ms #id)` resolves against `MILESTONES.md` (see below); an id that doesn't resolve
  renders as an "unknown milestone" chip, never an error.
- A task with an unfinished prerequisite is **blocked** (badge + can't move into Active).
  Every task gets an id automatically; missing ids are backfilled on load — with the used-id
  pool spanning **both** `TASKS.md` and `MILESTONES.md`.
- Subtasks: 2-space-indented `  - [ ]` lines with a title/check state. Optional subtask
  descriptions are 4-space-indented continuation lines below the subtask; the dashboard emits
  them as blockquote-style lines (`    > detail`) and round-trips them into the modal's
  subtask description field.
- Serialize always emits `[x]`/`[ ]`, bold titles, then `(needs …)`, `(ms …)`, `(owner …)`
  in that canonical order before the trailing `#id`, and `## Section` headers without bold.
  Absent tokens emit nothing, so a board that never uses them round-trips byte-identically.

## MILESTONES.md format contract

Same byte-pipe rules: the server only moves the file; the dashboard parses/serializes.

```markdown
# Milestones

- [ ] **Phoenix GA** - customer-facing launch (target 2026-08-01) #k7p
- [x] **Billing rewrite** - (target 2026-05-01) (done 2026-05-04) #q2m
```

- Flat one-line-per-milestone list (no sections, no subtask rows). Optional ` - note`,
  optional ` (target YYYY-MM-DD)`, done = `[x]` + ` (done YYYY-MM-DD)`, trailing bare `#id`
  LAST. Ids validate `^[0-9a-z]{2,8}$` and are **unique across TASKS.md + MILESTONES.md
  combined**; the dashboard loads milestones first, then tasks, so backfill can never mint
  a colliding id.
- **Progress is derived**: done children ÷ all children, where children = tasks carrying
  `(ms #id)` **plus** archived lines under `## Completed` in the milestone's detail file
  (clearing old Done tasks archives them there so progress never regresses).
- The board watches `MILESTONES.md` and `milestones/` for SSE exactly like `TASKS.md`.

## Completion gates (dashboard-enforced; render violations honestly)

- **Subtasks (hard, no waiver):** a task cannot be checked done while any subtask is
  unchecked. Already-enforced alongside the prerequisite lock.
- **Verification (hard, waivable):** a task cannot be checked done while any
  `## Verification` item in its detail file is still `[ ]`. Every item must be `[x]`
  (passed) or `[~]` (waived) first. The gate lives on the **checked action in the task
  modal** — the only UI path that completes a task — where the detail file is already
  loaded (zero extra fetches). The board's waive control stamps
  `(waived YYYY-MM-DD — <name>)` (operator; reason optional). Agents editing files must
  include a reason: `(waived YYYY-MM-DD — agent: <why>)`.
- **Milestones (hard):** a milestone cannot be checked done while any task carrying its
  `(ms #id)` is unchecked. Deleting a milestone from the board also removes its `(ms #id)`
  tag from all tasks and deletes its detail file.
- **Honest rendering:** these gates guard the UI only — the files are plain markdown and an
  agent can hand-write a violating state (a checked parent over open subtasks, a done
  milestone over open children). The board must **render that state as-is** plus a derived
  inconsistency chip; it never auto-unchecks, rewrites, or rejects the data.

## Per-task detail files (`.tasks/tasks/<id>.md`)

`TASKS.md` is the one-line-per-task index; a task's **rich detail** lives in
`.tasks/tasks/<id>.md` (keyed by the task's trailing `#id`), served via `/api/task`. The
dashboard's task modal reads/writes it. Format = a TT;DR-led markdown description, optionally
followed by `## `-headed sections; the board gives special treatment to `## Verification`
and `## Activity`:

```markdown
TT;DR: plain-English one-or-two-sentence summary (rendered as a callout).

Full plan — markdown is rendered (headings, lists, code, **bold**, _italic_, `code`, links).

## Verification
- [ ] `npm test` passes on the changed package
- [x] Staging /health returns 200 after deploy
- [~] Operator confirmed the panel copy (waived 2026-07-02 — agent: copy superseded by #d4e)

## Activity
- 2026-06-25 14:02 — created
- 2026-06-25 15:10 — moved To-Do → Active
```

- The browser parses the file **section-aware**: a leading description (everything before
  the first `## ` header), then the ordered `## ` blocks. `## Verification` (case-insensitive)
  parses into checklist items — `[ ]` open / `[x]` passed / `[~]` waived, with an optional
  trailing `(waived YYYY-MM-DD — <who>: <reason>)` on waived items. `## Activity` parses
  into `- ` log lines (rendered newest-first in the modal). **Every other section is
  preserved verbatim, in its original position** — loading and saving a detail file must
  never drop or reorder content the board doesn't understand.
- The serializer **never emits an empty `## Verification`** — a file without one stays
  byte-identical on round-trip; the section is inserted (before `## Activity`) only when the
  first item is added.
- In milestone detail files the same parser also recognizes `## Completed` — the archive of
  cleared child-task lines that keeps counting toward milestone progress.
- Files are **lazy/optional** — a task with no detail file shows an empty description. They're
  created on first write and **deleted when the task is deleted** (the modal's delete fires
  `DELETE /api/task?id=`; milestone deletes fire `DELETE /api/milestone?id=`). Agents editing
  `TASKS.md` by hand should mirror that: remove `.tasks/tasks/<id>.md` when they remove a task.

## config.json and secure/ (setup-owned; the server stays out)

- **`.tasks/config.json`** — durable setup choices written by `/tasks-start`:
  `{ "schemaVersion": 1, "git": "tracked"|"ignored"|"none", "hooks": "shared"|"local",
  "createdAt": "...", "pluginVersion": "..." }`. The board **may read** it (via
  `GET /api/config`) for cosmetic affordances; it must **never write or act on** it.
- **`.tasks/secure/`** — the gitignored private store (secrets + personal notes). The server
  must keep it **unreachable**: no API route can read or write into it (the memory API is
  path-guarded to `CLAUDE.md`/`memory/`, detail APIs are id-regex + fixed-dir, the vendor
  route is confined to `vendor/`), and the recursive watcher ignores it so edits there never
  surface over SSE.

## Tiered dependencies

The board **progressively enhances**. Its core (the Kanban board, live sync, the Slot Roll and
FLIP motion) is built from Node + browser built-ins and works with **zero** external assets. On
top of that it can layer optional enhancements — the **anime.js** motion driver, the vendored
**brand fonts** (IBM Plex Mono + Unbounded), the **animated brand mark**, and `fonts.css`. The
board looks and behaves **identically at every tier**; tiers differ only in *where the bytes
come from*, never in *what the board does*. Makira (the SHAUGHV body face) is a **commercial
license** and is **never bundled or mirrored** — it loads from the CDN when reachable and
otherwise falls back to the system font stack (the motion is glyph-agnostic, so it's invisible).

### The `install` chain (server side)

`board-server.mjs install` provisions those assets into `.tasks/vendor/` with a
**try-everything chain, first success wins**, and each candidate is verified against a pinned
**sha256** (so version drift, corruption, or a tampered CDN response is rejected and falls
through):

| Tier | Source | How |
|---|---|---|
| **full** | npm | `npm install` the pinned `animejs` into a **transient** `.tasks/node_modules`, verify, copy the artefact into `vendor/`, then **prune `node_modules`** (nothing npm-related persists). |
| **vendor** | pinned CDN fetch | `https` GET each asset (anime.js, woff2s, brand mark) straight into `vendor/`. |
| **shipped** | the plugin bundle | copy from `${CLAUDE_PLUGIN_ROOT}/skills/tasks-start/assets/vendor/` — the offline-capable floor-with-assets. |
| **offline** | nothing | provision nothing; the dashboard inlines its built-in engine + system fonts. Cannot fail. |

Per-asset, the chain walks the allowed tiers high→low; the first sha-valid source wins. `--tier`
caps the highest tier tried; `--offline` means "no network, no npm" (caps at **shipped**, the
right behaviour for a disconnected machine); `--tier offline` forces the true floor. `install`
**always exits 0** — the offline floor is a valid outcome — and is **idempotent**: an
already-valid asset is reused (its provenance preserved), and a re-run rebuilds the manifest
from actual on-disk state, so a deleted asset is re-provisioned (integrity self-heal).

The achieved `tier` recorded is that of `anime.min.js` (the marquee enhancement); fonts and the
brand mark degrade independently and are recorded per-asset.

### Global Node bootstrap

`install` runs *under* Node, so Node is normally already present. Two seams cover the rest:

- If npm is missing and the full tier is requested (and not `--no-global`/`--offline`), `install`
  makes a **best-effort, non-interactive** global Node install (winget / brew / apt-gated-on-`sudo -n`),
  then retries npm. Any UAC prompt / timeout / non-zero exit is treated as failure → fall through.
- When Node is **wholly absent**, `/tasks-start` installs it *before* it can run this script and
  passes `--node-bootstrap "<manager>:<id>"` so `install` records it.

**Every** global change — attempted or successful — is written to the manifest's `global[]` with
`wasPreexisting:false`, the exact `reverseCommand`, and `reverseRisk:"high"`. This is the only
out-of-`.tasks/` residue the system can create, and it's what makes `/tasks-remove` able to offer
a complete, opt-in reversal.

### The static route

The server serves provisioned assets at `GET /vendor/*` from `.tasks/vendor/` (confined,
binary-safe, correct MIME — see the HTTP API list above). The recursive `fs.watch` ignores
`vendor/`, `node_modules/`, `package.json`/lock, the manifest, `secure/`, and `*.tmp` so
provisioning and secret edits never spam SSE.

### The dashboard's runtime loader (browser side)

Over `http(s)` (SERVER_MODE) the dashboard prefers the local `/vendor/*` copies, self-heals to the
CDN, and finally to system fonts / its built-in engine — per resource, resolving (never
rejecting), so degradation is automatic and silent:

- **fonts** — inject `/vendor/fonts.css` (itself local-first → CDN per `@font-face`) after the CDN
  `<link>`s; Makira + anything unvendored still resolves from the CDN / system stack.
- **anime.js** — `/vendor/anime.min.js` → CDN → leave `window.anime` undefined. The Slot Roll
  checks `window.anime` **per call**, so a late load is picked up with no reload; when present it
  drives the per-glyph roll from the **same computed tuple** as the built-in CSS driver (identical
  motion — asserted via `window.__slotTuples` parity). **FLIP stays on WAAPI at every tier.**
- **brand mark** — `/vendor/animated-brand-mark.js` (self-guards `customElements.define`, so it's
  safe alongside the CDN `<script>`); if `<shaughv-mark>` is still undefined shortly after, a tiny
  dependency-free text fallback registers so the mark still reads "SHAUGHV" offline.

`prefers-reduced-motion` is honoured above the driver check, so reduced-motion snaps regardless of
tier. Over `file://` the static CDN tags are used as before (no `/vendor/` to reach).

### The install manifest (`.tasks/.install-manifest.json`)

Written **eagerly** (`status:"in-progress"`) and updated after each asset, then finalized
(`status:"complete"`) — so a crash mid-install still leaves a valid, exhaustive record.
`/tasks-remove` reads it for a complete uninstall. Shape:

```jsonc
{
  "schemaVersion": 1,
  "pluginVersion": "0.23.0",        // read from CLAUDE_PLUGIN_ROOT/.claude-plugin/plugin.json, else "unknown"
  "status": "complete",             // "in-progress" while running; a partial crash leaves this
  "requestedTier": "full",
  "tier": "vendor",                 // achieved (tracks anime.min.js)
  "options": { "offline": false, "noGlobal": false },
  "node": { "version": "v24.x", "execPath": "…", "platform": "win32" },
  "assets": [                        // one per PINNED entry
    { "path": "anime.min.js", "source": "npm|cdn|shipped|absent", "sha256": "…", "bytes": 17384, "ok": true }
  ],
  "created": { "dirs": ["vendor", …], "files": [ { "path": "vendor/…", "sha256": "…", "bytes": …, "source": "…" } ] },
  "npm": [],                         // intentionally empty — node_modules is transient (pruned)
  "global": [                        // OUT-OF-TREE changes — the only thing not under .tasks/
    { "kind": "node", "manager": "winget", "id": "OpenJS.NodeJS.LTS", "wasPreexisting": false,
      "succeeded": true, "reverseCommand": "winget uninstall --id OpenJS.NodeJS.LTS -e",
      "reverseRisk": "high", "note": "…" }
  ],
  "notes": ["Makira … never bundled …"]
}
```

### Teardown contract (`/tasks-remove`)

`.tasks/vendor/`, any transient `node_modules`/`package.json`, and the manifest all live **under
`.tasks/`**, so deleting the folder removes them wholesale (the `created` lists are a cross-check,
not a separate pass). The manifest's `global[]` is the exception: for each `wasPreexisting:false`,
`succeeded:true` entry, `/tasks-remove` **offers** the recorded `reverseCommand` (default **keep**,
never auto-run, high-risk caveat surfaced). No manifest → legacy marker-only teardown, no global
reversal. Unknown `schemaVersion` → delete `.tasks/` and print the raw `global[]` for manual cleanup.
