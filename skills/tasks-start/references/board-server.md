# board-server.mjs — the live localhost board + maintenance hooks

`board-server.mjs` ships in `skills/tasks-start/assets/` and is copied into `.tasks/`
by `/tasks-start` alongside `dashboard.html` and the tracked `.board-version.json` bundle
marker. It is the single source of truth for how the live board runs and how
the board-maintenance hooks are wired into a target repo. **`/tasks-start` and
`/tasks-remove` must follow this file verbatim** so the install string and the teardown
match string never drift apart.

It uses **only Node built-ins** — no `npm install`, no build step. It requires `node` on
PATH; if Node is absent, fall back to the legacy `file://` dashboard flow (open
`dashboard.html` from a file browser and use the Select-file pickers).

## Contents

- [Subcommands](#subcommands)
- [How it serves and live-syncs](#how-it-serves-and-live-syncs)
- [The board-maintenance hooks](#the-board-maintenance-hooks-written-into-the-target-repo)
- [TASKS.md format contract](#tasksmd-format-contract-server--dashboard-must-agree)
- [MILESTONES.md format contract](#milestonesmd-format-contract)
- [Completion gates](#completion-gates-dashboard-enforced-render-violations-honestly)
- [Per-task detail files](#per-task-detail-files-taskstasksidmd)
- [config.json and secure](#configjson-and-secure-setup-owned-the-server-stays-out)
- [Tiered dependencies](#tiered-dependencies)
  - [Install chain](#the-install-chain-server-side)
  - [Global Node bootstrap](#global-node-bootstrap)
  - [Static route and runtime loader](#the-static-route)
  - [Install manifest and teardown](#the-install-manifest-tasksinstall-manifestjson)

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
- **Ping is an identity check, not just a liveness check.** `/api/ping` reports a stable
  `boardId`, the absolute `.tasks/` **root**, and the canonical `tasksPath` alongside the
  `shaughv-task-board` token. `ensure` only treats a responder as "already running" when
  the root matches *this* board's `.tasks/` — a different root means **another repo's
  board holds the port**, which is handled as a busy port: this board starts on the next
  free port. `status` prints the root too. Multiple boards on one machine is a supported,
  normal setup; agents must resolve ports from their own repo's state file and verify the
  root before writing through any API (full rules: the `tasks-boards` skill).
- HTTP API (the server stays **dumb** about markdown — the browser keeps all parse/serialize):
  - `GET /` → serves `dashboard.html`; `GET /dashboard.css` serves its styles.
  - `GET /api/tasks` → raw `TASKS.md`; response carries `X-Board-Revision`,
    `X-Board-Mtime`, and `X-Board-Id`.
  - `POST /api/tasks` → serialized atomic write. Current clients send
    `X-Base-Board-Revision`; content-hash CAS rejects stale writes with **409** even when two
    filesystem timestamps collide. `X-Base-Mtime` remains the older-client fallback. A dashboard
    completion also sends
    `X-Completion-Task-Id` and the re-read `X-Completion-Detail-Revision`; under the same
    per-task lock used by detail writes, the server returns **412** if that checklist changed
    before the checked board write. Any newly checked transition without this receipt is rejected.
    Deletion sends `X-Delete-Task-Id`; the server moves its detail out of the live id path, writes
    the board removal, then cleans the tombstone. An unlink failure can retain only that hidden,
    unserved, unwatched, gitignored tombstone under `.task-detail-tombstones/`, never a live-id
    detail or a restored local task. Unguarded task removal is rejected.
    Current dashboards also send `X-Expected-Board-Id`; a stale tab pointed at a different board
    is rejected before write.
  - `GET|POST /api/milestones` → raw `MILESTONES.md`, exactly the same semantics as
    `/api/tasks` (mtime header, 409-with-latest, atomic write). GET returns the
    `# Milestones` skeleton when the file doesn't exist yet; the file is only created on
    first write.
  - `GET|POST|DELETE /api/milestone?id=<id>` → a milestone's rich detail file at
    `.tasks/milestones/<id>.md`. It shares `/api/task?id=` id validation, lazy-file behavior,
    atomic replacement, and delete-with-the-milestone, but is not part of the task Verification
    revision contract.
  - `GET /api/config` → raw `.tasks/config.json` bytes (`{}` if missing). **Read-only** —
    the server never parses or writes it; setup (`/tasks-start`) owns it.
  - `GET /board-config.js` → the generated, no-store project-title companion used by the
    dashboard in both localhost and `file://` modes. Missing files return an empty identity.
  - `GET /api/events` → **SSE**; a `change` event fires when board state changes on disk or
    through any browser tab,
    with a `kind` of `tasks`, `milestones`, `detail`, `config`, or `memory` so the browser
    refreshes or flags the affected surface. A generic detail event never replaces an open
    modal because it cannot identify the task and unblurred field drafts may exist; completion
    re-reads its own detail, while close/reopen is the explicit visual refresh boundary.
    Implemented with `fs.watchFile` on `TASKS.md` and `MILESTONES.md`
    (reliable cross-platform) plus a best-effort recursive `fs.watch`. **`secure/` is
    excluded from watching** — edits there never produce events.
  - `GET|POST /api/memory/tree`, `/api/memory/file?path=` → memory tab; writes are
    path-guarded to `CLAUDE.md` or `*.md` under `memory/` (traversal / absolute / non-`.md`
    / symlink-escape all rejected).
  - `GET|POST|DELETE /api/task?id=<id>` → a task's rich detail file at `.tasks/tasks/<id>.md`
    (the description + activity log behind the dashboard's task modal). `id` is validated
    `^[0-9a-z]{2,8}$` (the task's trailing `#id`). GET returns the raw markdown (empty string
    if the file doesn't exist yet — detail files are lazy/optional) plus
    `X-Detail-Revision`. POST requires that value as `X-Base-Revision`; the server serializes
    compare-and-write operations per task and returns **409 with the latest content** on a stale
    base, or **428** when the precondition is absent. Successful POST uses atomic replacement
    and returns the new revision. A checked task's detail is immutable through this route
    (**423**) until the task is reopened, preventing a later contract edit from invalidating a
    completion receipt in place. Current dashboard deletion is the guarded `/api/tasks`
    transaction above. **DELETE** is orphan cleanup only and returns **409** while `TASKS.md`
    still names the task. Browser writes broadcast to sibling tabs immediately while their
    matching filesystem-watch echo is de-duplicated.
  - `GET /vendor/*` → static read of a provisioned display asset from `.tasks/vendor/`
    (anime.js, the brand woff2s, the brand mark, `fonts.css`). Same path confinement as the
    memory API (`path.resolve` under `vendor/`, traversal / NUL / drive-escape → 403; encoded
    `..` is also neutralised by URL normalisation). Binary-safe (`res.end(buffer)`), correct
    MIME per extension, `Cache-Control: public, max-age=3600`. A missing file 404s so the
    dashboard's runtime loader falls through to its CDN / inline fallback. See
    [Tiered dependencies](#tiered-dependencies).
- `dashboard.html` auto-detects: over `http(s)` it uses this API + SSE; over `file://` it
  uses the File System Access API. Static mode identity-matches the selected `TASKS.md` against
  `TASKS.md` inside the selected `.tasks/` folder before reading/writing `tasks/<id>.md`;
  each static whole-file write compares the current durable bytes with the loaded base and
  refuses a detected external change. Static completion is intentionally locked: File System
  Access cannot atomically couple a detail revision with the checked `TASKS.md` write. Use the
  live localhost board for completion and deletion; deletion likewise cannot atomically remove
  the board entry and retire its detail file in static mode. One file, both modes.
- In live mode, the source line is derived from `/api/ping.tasksPath` and carries the full
  canonical path + localhost origin in its tooltip. In `file://` mode the browser exposes only
  the selected handle's name, so the UI says **Selected file** instead of implying a full path.
- Auto-open is **only** on the explicit `/tasks-start` launch (`ensure --open`). Hooks call
  `ensure` **without** `--open`, so they revive the server silently and never pop a browser
  tab every session.

## The board-maintenance hooks (written into the TARGET repo)

Use [host setup](hosts.md) as the normative installation, consent, migration, and removal
contract. Generate the active host's JSON with `node .tasks/board-hooks.mjs codex` or
`node .tasks/board-hooks.mjs claude`. The plugin ships no root hooks or hook registration.
The generated bridge uses the host payload's cwd and the nearest ancestor board, so a
nested shell directory and paths with spaces work. It does not write settings itself.

The server handles SessionStart, PostToolUse, SubagentStart, and SubagentStop. PostToolUse
ignores commands other than git commit/push. Claude also recognizes ExitPlanMode; the
Codex bridge explicitly excludes that approval interpretation. Per-type cooldowns remain
30 seconds; SessionStart always supplies context. No hook opens a browser tab.

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

## Completed
- [x] **Completed task** #x9z
```

- `## Section` headers (optional `**bold**`); section id = lowercased, non-alnum → `-`.
  Fresh-board categories are **Backlog → To-Do → Active → Completed** (file order = category
  order). Existing custom categories are preserved; legacy **Done** categories still work.
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
  (clearing old Completed tasks archives them there so progress never regresses).
- The board watches `MILESTONES.md` and `milestones/` for SSE exactly like `TASKS.md`.

## Completion gates (dashboard-enforced; render violations honestly)

- **Subtasks (hard, no waiver):** a task cannot be checked done while any subtask is
  unchecked. Already-enforced alongside the prerequisite lock.
- **Verification (hard, waivable only by authority):** a task cannot be checked done while
  any `## Verification` item in its detail file is still `[ ]`. Every item must be `[x]`
  (passed) or `[~]` (waived) first. The gate lives on the **checked action in the task
  modal** — the only UI path that completes a task — where the detail file is already
  loaded. Live mode waits for pending detail writes, re-reads the durable checklist, and sends
  that exact revision with the checked board write. The server serializes task writes and
  compares the detail revision under the per-task detail lock; a concurrent edit makes one
  request retry rather than admitting a stale completion. Static mode may read and edit details
  but refuses completion because it cannot provide this cross-file atomic guard. The board's
  waive and remove controls require an explicit
  authority acknowledgement and reason, append an Activity record, and stamp
  `(waived YYYY-MM-DD — <who>: <reason>)` for waivers. `[~]` records that an authorized
  operator, policy, or accepted contract change removed, deferred, or made the criterion
  inapplicable; it is never a substitute for evidence an agent could not obtain. Editing any
  criterion requires the same audited contract-change flow; a passed/waived edit also resets it
  open. Completion
  rejects legacy/malformed waivers without a dated who-and-reason record.
- **Completed-task immutability:** reopen a task before changing its title, routing fields,
  subtasks, description, checklist, evidence, or activity. The live dashboard locks these
  controls, and the detail route returns **423** if another tab tries to write after completion.
  This keeps the checked state tied to the contract and evidence it actually certified.
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

Stable dependency skeleton plus a short next-action window with its prediction, oracle, and
redirect condition. Markdown renders headings, lists, code, **bold**, _italic_, `code`, and links.

## Verification
- [ ] `npm test` passes on the changed package
- [x] Staging /health returns 200 after deploy
- [~] Panel-copy approval deferred (waived 2026-07-02 — operator: moved to #d4e)

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
  created on first write and **deleted when the task is deleted**. In live mode, the modal uses
  the guarded `POST /api/tasks` removal transaction; direct task-detail DELETE is orphan cleanup
  only. Static mode refuses task deletion because it cannot couple both files. Milestone deletes
  still fire `DELETE /api/milestone?id=`. Agents editing files by hand must remove the board line
  and `.tasks/tasks/<id>.md` as one reviewed change.

## config.json and secure/ (setup-owned; the server stays out)

- **`.tasks/config.json`** — durable setup choices written by `/tasks-start`:
  `{ "schemaVersion": 1, "git": "tracked"|"ignored"|"none", "hooks": "shared"|"local",
  "boardTitle": "Magic Pantry", "createdAt": "...", "pluginVersion": "..." }`. The board
  **may read** it (via
  `GET /api/config`) for cosmetic affordances; it must **never write or act on** it.
- **`.tasks/board-config.js`** — generated from `config.json.boardTitle` by `/tasks-start`
  and `/tasks-update` as `window.SHAUGHV_TASKS_BOARD = {"boardTitle":"..."};`. It is outside
  the versioned app bundle, not gitignored, and reconciled on every start/update so custom
  project identity survives upgrades and direct `file://` opens.
- **`.tasks/.board-version.json`** — tracked source-of-truth marker for the copied board
  application bundle (`dashboard.html` + `dashboard.css` + `board-server.mjs` + `board-hooks.mjs`). `/tasks-start` compares it on
  every relaunch and moves the whole bundle forward only when the loaded skill is newer;
  `config.json.pluginVersion` is reconciled after a successful copy. A newer target is never
  downgraded by an older plugin install.
- **`.tasks/secure/`** — the gitignored private store (secrets + personal notes). The server
  must keep it **unreachable**: no API route can read or write into it (the memory API is
  path-guarded to `CLAUDE.md`/`memory/`, detail APIs are id-regex + fixed-dir, the vendor
  route is confined to `vendor/`), and the recursive watcher ignores it so edits there never
  surface over SSE.
- **`.tasks/.task-detail-tombstones/`** — internal, gitignored, unserved, and unwatched. A
  guarded deletion briefly moves live detail here before committing the board removal; only a
  failed final filesystem cleanup leaves anything behind.

## Tiered dependencies

The board **progressively enhances**. Its core (the Kanban board, live sync, the Slot Roll and
FLIP motion) is built from Node + browser built-ins and works with **zero** external assets. On
top of that it layers the **anime.js** motion driver, nine authorized **brand-font WOFF2s**
(Makira Light 300 plus Makira and Gail Rock at 400, 500, 600, and 700), the **animated brand mark**, canonical loader, and
`fonts.css` — 13 sha256-pinned assets in total. Makira is the board's body/display face; Gail Rock
is the technical monospace face. The shipped tier keeps that typography intact without a network.
Missing assets must be reported as degraded presentation; repair the supplied font files
before accepting typography. The stylesheet declares only Makira and Gail Rock.

### The `install` chain (server side)

`/tasks-start` resolves the loaded skill's `assets/` directory and supplies it to the install
subprocess as `SHAUGHV_TASKS_ASSETS_DIR`; the copied `.board-version.json` supplies the exact
plugin version. `board-server.mjs install` then provisions those assets into `.tasks/vendor/` with a
**try-everything chain, first success wins**, and each candidate is verified against a pinned
**sha256** (so version drift, corruption, or a tampered CDN response is rejected and falls
through):

| Tier | Source | How |
|---|---|---|
| **full** | npm | `npm install` the pinned `animejs` into a **transient** `.tasks/node_modules`, verify, copy the artefact into `vendor/`, then **prune `node_modules`** (nothing npm-related persists). |
| **vendor** | pinned CDN fetch | `https` GET each available asset straight into `vendor/`; the byte-identical Makira CDN files are secondary candidates, while Gail Rock deliberately has no network candidate. |
| **shipped** | the plugin bundle | copy from the absolute assets directory supplied by `/tasks-start` in `SHAUGHV_TASKS_ASSETS_DIR`; host plugin-root variables are compatibility fallbacks. This is the offline-capable floor-with-assets in Claude Code, Codex, and standalone skills.sh installs. |
| **offline** | nothing | no assets provisioned; core data access still works, but typography/branding requires repair. |

Per-asset, the chain walks the allowed tiers high→low; the first sha-valid source wins. `--tier`
caps the highest tier tried; `--offline` means "no network, no npm" (caps at **shipped**, the
right behaviour for a disconnected machine); `--tier offline` forces the true floor. `install`
**always exits 0** — the offline floor is a valid outcome — and is **idempotent**: an
already-valid asset is reused (its provenance preserved), and a re-run rebuilds the manifest
from actual on-disk state, so a deleted asset is re-provisioned (integrity self-heal).

`fonts.css` is pinned like every binary, so an older board's stale stylesheet is replaced on its
next install. Reconciliation also removes only the two retired plugin-owned directories
`vendor/fonts/ibm-plex-mono/` and `vendor/fonts/unbounded/`; unrelated vendor content is untouched.

The achieved `tier` recorded is that of `anime.min.js` (the marquee enhancement); fonts and the
brand mark degrade independently and are recorded per-asset.

### Global Node bootstrap

Both the installer and live board require `node` on `PATH`. Before running `install`, call
`node --version` and follow exactly one route:

- **Node present** — run `node .tasks/board-server.mjs install`, then launch normally.
- **Node absent** — the live server cannot start. A Node install is a global, out-of-tree
  machine change, so mention it and obtain operator authority unless the user already gave
  explicit authority such as "just make it work." Attempt the available platform route
  non-interactively:

  | Platform | Command | Bootstrap record |
  |---|---|---|
  | Windows | `winget install --id OpenJS.NodeJS.LTS -e --silent --accept-package-agreements --accept-source-agreements` | `winget:OpenJS.NodeJS.LTS` |
  | macOS | `brew install node` | `brew:node` |
  | Linux with nvm | `nvm install --lts` | `nvm:lts` |
  | Linux without nvm | `sudo -n apt-get install -y nodejs npm`, only when passwordless sudo works | `apt:nodejs` |

  After a successful bootstrap, refresh command discovery if needed and run:

  ```text
  node .tasks/board-server.mjs install --node-bootstrap "<manager>:<id>"
  ```

  The bootstrap record gives `/tasks-remove` the matching opt-in reversal.
- **Node still unavailable** — continue with the static `file://` route; never block setup.
  Have the operator open `.tasks/dashboard.html`, select `.tasks/TASKS.md`, and select the
  matching `.tasks/` folder. Static mode loses live two-way sync but can read and write task
  details after identity-matching those handles. Completion and deletion always remain
  live-board-only because static browser access cannot atomically couple their cross-file writes.

Once Node can run `install`, two additional seams cover partial dependency availability:

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

The dashboard loads relative `./vendor/` assets in both localhost and file mode.
Font declarations use only the supplied local WOFF2 files. The canonical brand mark,
loader, and anime.js are local scripts, with no duplicate remote script loads. The
installer still verifies every downloaded or copied candidate against its pinned hash.
If anime.js is unavailable, the existing built-in Slot Roll driver remains available;
FLIP uses WAAPI. Missing fonts or brand assets need installer repair before visual acceptance.

`prefers-reduced-motion` is honoured above the driver check, so reduced-motion snaps regardless of
tier. Over `file://`, the same relative stylesheet and font URLs resolve from the selected board
folder.

### The install manifest (`.tasks/.install-manifest.json`)

Written **eagerly** (`status:"in-progress"`) and updated after each asset, then finalized
(`status:"complete"`) — so a crash mid-install still leaves a valid, exhaustive record.
`/tasks-remove` reads it for a complete uninstall. Shape:

```jsonc
{
  "schemaVersion": 1,
  "pluginVersion": "1.0.0",         // read from .tasks/.board-version.json; explicit assets/host envs are fallbacks
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
  "notes": ["Makira and Gail Rock are bundled as authorized exact WOFF2 assets …"]
}
```

### Teardown contract (`/tasks-remove`)

`.tasks/vendor/`, any transient `node_modules`/`package.json`, and the manifest all live **under
`.tasks/`**, so deleting the folder removes them wholesale (the `created` lists are a cross-check,
not a separate pass). The manifest's `global[]` is the exception: for each `wasPreexisting:false`,
`succeeded:true` entry, `/tasks-remove` **offers** the recorded `reverseCommand` (default **keep**,
never auto-run, high-risk caveat surfaced). No manifest → legacy marker-only teardown, no global
reversal. Unknown `schemaVersion` → delete `.tasks/` and print the raw `global[]` for manual cleanup.
