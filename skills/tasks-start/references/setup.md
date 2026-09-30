# Set up or upgrade the board

Run this entire step for a fresh setup **and** every existing board before launch. This is the
repair/upgrade gate; never jump from resume directly to step 3.

- **Resolve the active skill bundle first.** Let `<skill-dir>` be the directory containing the
  `tasks-start/SKILL.md` that is executing now, and `<assets-dir>` be `<skill-dir>/assets`.
  Resolve it from the skill's loaded filesystem path; `${CLAUDE_PLUGIN_ROOT}/skills/tasks-start`
  is only a Claude Code fallback, not a portable assumption. Read and validate
  `<assets-dir>/board-version.json`; its semantic `pluginVersion` is the source bundle version.
Create the `.tasks/` folder if needed, then populate or repair it:

- **`.tasks/TASKS.md`** — if absent, create with exactly these four empty categories in this
  order: **Backlog → To-Do → Active → Completed** (use the standard template in the
  `tasks-management` skill). Never rewrite an existing board's custom categories or order.
- **`.tasks/MILESTONES.md`** — if absent, create with the `# Milestones` skeleton (see
  `tasks-management`).
- **`.tasks/config.json`** — if absent, write it eagerly as part of the persistent skeleton,
  with a safe floor:

  ```json
  { "schemaVersion": 1, "git": "ignored", "hooks": "local",
    "boardTitle": "<project name>", "createdAt": "<today>",
    "pluginVersion": "<from assets/board-version.json>" }
  ```

  `"ignored"` is the conservative floor (nothing gets committed by accident); the ask-once
  question below corrects it. If the folder isn't inside a git repo at all, write
  `"git": "none"` and skip that question entirely. If the file already exists, preserve
  every recorded choice; the title invariant below owns `boardTitle`, and the bundle logic
  may reconcile only `pluginVersion`.
- **Durable project-facing board title (fresh setup + every update/relaunch).** The visible
  heading and browser tab must name the project being built or tracked — never remain only
  `Tasks`. `config.json.boardTitle` is the source of truth:
  - Preserve any existing non-generic value exactly. Once meaningful, it changes only when
    the operator explicitly asks to rename the board.
  - Missing/blank values and generic placeholders such as `Tasks`, `Task Board`, or
    `SHAUGHV Tasks` (case-insensitive) require a one-time backfill. Infer the real name from,
    in order: an explicit project/product name in the request or established repo guidance;
    the README heading or primary package manifest; the Git remote repository name; then a
    prettified project-folder name. If credible high-priority signals conflict, ask once. In
    unattended work, use the best non-generic repo/folder name so the board never stays
    `Tasks`.
  - After choosing the title, persist it in `config.json` while preserving every other key,
    then generate `.tasks/board-config.js` from the same value using a real JSON serializer:

    ```js
    window.SHAUGHV_TASKS_BOARD = {"boardTitle":"Magic Pantry"};
    ```

    `config.json` remains authoritative; reconcile this derived one-line companion on every
    `/tasks-start` and `/tasks-update`. It is deliberately outside the versioned app bundle,
    is not gitignored, and therefore survives dashboard upgrades and works when
    `dashboard.html` is opened directly with `file://`.
- **Board application bundle (upgrade-only)** — the bundle is
  `dashboard.html`, `dashboard.css`, `board-server.mjs`, `board-hooks.mjs`, and
  `board-version.json` from `<assets-dir>`; copy them into `.tasks/`, renaming only
  `board-version.json` to `.board-version.json`. The `.mjs` is the
  zero-dependency Node server that serves the dashboard on localhost and live-syncs the
  board (see [`board-server.md`](board-server.md)). Determine the
  target version from `.tasks/.board-version.json`, falling back to the first valid semantic
  `pluginVersion` in `.tasks/config.json` and `.tasks/.install-manifest.json`.
  - Fresh/missing/invalid target version, or source version **newer** → copy all five files
    as one bundle. Only after every copy succeeds, set `config.json.pluginVersion` to the
    source version while preserving every other config key.
  - Equal versions → preserve existing app files; repair any missing member from the same
    source bundle, ensure `.board-version.json` exists, and reconcile only the config version.
  - Target version **newer** → do not copy or restamp anything. Report the newer board and
    continue without downgrading it.
  - Before changing or repairing the bundle, record whether this board's server is running
    (`node .tasks/board-server.mjs status`). If a running board's `board-server.mjs` changes,
    restart it with the newly copied script (`stop`, then `ensure`) so open tabs cannot remain
    attached to old in-memory server behavior. Preserve stopped boards as stopped.

  This comparison and copy decision happens on **every** `/tasks-start`, including relaunches
  and ancestor-board resumes. On a shared board, an older operator therefore cannot flip
  committed app files backwards, while every newer install deterministically rolls the whole
  bundle forward instead of leaving a stale dashboard behind.
- **`.tasks/.gitignore`** — always scaffold (both git modes), with exactly:

  ```
  secure/
  .task-detail-tombstones/
  .board-server.json
  .board-nudge.json
  .board-server.log
  vendor/
  node_modules/
  package.json
  package-lock.json
  .package-lock.json
  .install-manifest.json
  *.tmp
  ```

  Reconcile this scoped file on upgrades. Deliberately **not** ignored: `dashboard.html`, `dashboard.css`, `board-server.mjs`, `board-hooks.mjs`, `board-config.js`, and
  `.board-version.json` — on a tracked board they're committed so collaborators who clone get
  the project-named, version-identifiable board source. Display assets in `vendor/` are
  local: run `/tasks-start` once after cloning to provision the supplied fonts and scripts,
  then launch directly with `node .tasks/board-server.mjs ensure`.
- **`.tasks/secure/`** — create the directory with a short local `secure/README.md`
  explaining the convention (it's gitignored, so it exists only for someone browsing the
  folder; the committable pointer lives in `.tasks/CLAUDE.md` — see `tasks-memory`).
- **Provision/repair the board's display dependencies (tiered).** On every setup or relaunch,
  after the bundle decision and **before** launching the server in step 3, run the internal
  installer. For that subprocess, set `SHAUGHV_TASKS_ASSETS_DIR` to the absolute
  `<assets-dir>` resolved above so the shipped offline tier works in Claude Code, Codex, and
  standalone skills.sh installs alike:

  ```
  node .tasks/board-server.mjs install
  ```

  This is an **internal subcommand, not a user-facing command** — never tell the user to run
  it. It provisions the board's optional enhancement assets (the anime.js motion driver, the
  authorized Makira + Gail Rock brand fonts, the animated brand mark) into `.tasks/vendor/` using a
  **try-everything chain** — npm → pinned CDN fetch → the plugin's shipped copies → a fully
  offline floor — and writes `.tasks/.install-manifest.json` recording exactly what it did
  (so `/tasks-remove` can fully undo it). **It can fall back to the shipped assets**: the shipped tier provisions all
  13 pinned assets from the plugin with no network, including Makira Light 300, Makira and Gail Rock weights 400,
  500, 600, and 700. If every asset source is unavailable, report the degraded display and
  repair from the shipped package before accepting the board's typography as complete.
  Upgrades replace a stale `fonts.css` and remove the retired plugin-owned IBM Plex Mono and
  Unbounded font directories. It prints a one-line `tier=…` summary you can surface in the final report.
  Re-running it is safe and idempotent.
- **`.tasks/CLAUDE.md` + `.tasks/memory/` (scaffold now, enrich later)** — if absent, this is
  a fresh setup. Create the persistent skeleton **immediately**, before any interactive
  bootstrapping, so a durable memory + config scaffold exists even if the operator stops here:
  - `.tasks/CLAUDE.md` — the working-memory skeleton (the `tasks-memory` shape: `## Me`,
    `## People`, `## Terms`, `## Projects`, `## Preferences`, with empty tables), a marker
    comment as the very first line: `<!-- tasks-bootstrap: pending -->`, and the secrets
    pointer as the second line:
    `> Secrets: never stored here or in memory/. See .tasks/secure/ (gitignored), or env/keychain.`
  - `.tasks/memory/` — `glossary.md` (with its section headers) plus `people/`, `projects/`,
    and `context/` directories (drop a `.gitkeep` in each so the empty tree persists when
    the operator tracks `.tasks/`).

  The actual *enrichment* (decoding the operator's real shorthand) still happens interactively
  in the optional memory bootstrap after the board is up. The install manifest (above) and the board hooks
  (step 4) are the rest of the persistent **configuration** — all created before the Q&A, so
  the task list + memory + config are guaranteed to exist on every init.

#### Ask once — git tracking (fresh setup only)

This is the one setup question that changes what lands outside `.tasks/`. It is asked
**only here, on a true initial setup** — the resume path in step 1 reads the recorded
answer from `config.json` and never asks again (so "open my board" stays question-free).
Ask it right after the skeleton above exists, record the answer, move on:

> This board can be **git-tracked** — committed with the repo so teammates and other
> agents share the same tasks, milestones, and memory (a first-class way to run this) —
> or **kept local**, ignored and just for you on this machine. Which do you want?
> [tracked / local]

- **tracked** → set `config.json` to `"git": "tracked"`, `"hooks": "shared"`. Do **not**
  add a `.tasks/` line to the repo-root `.gitignore` — the scoped `.tasks/.gitignore`
  already keeps `secure/` and runtime files out. This is a natural commit point: offer to
  commit the new board (defer to the `git-workflow` skill if it's installed; otherwise a
  normal commit) — never auto-commit.
- **local** → keep `"git": "ignored"`, `"hooks": "local"`, and add a `.tasks/` line to the
  repo-root `.gitignore`.
- **Unattended setup, or no answer** → the `"ignored"` floor stands (also add the root
  `.gitignore` line so the floor is real); a later resume honors it and does not re-ask.
- **Not a git repo** → `"git": "none"` was already written above; skip the question.

#### Node dependency (detect → bootstrap → offline fallback)

Before running `install`, follow the normative [Global Node
bootstrap](board-server.md#global-node-bootstrap): detect Node, obtain authority for
machine-wide installs, record successful provisioning, and use its guarded static fallback.
