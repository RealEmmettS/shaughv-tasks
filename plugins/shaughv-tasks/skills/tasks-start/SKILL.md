---
name: tasks-start
description: >
  Initialize Emmett's task + workplace-memory system in the current repo or folder and
  open the SHAUGHV dashboard. Use whenever the user says /tasks-start, "set up my tasks",
  "start the task system", "set up task tracking", "bootstrap my memory", "set up the
  productivity system", or otherwise wants a place to track todos and teach Claude their
  people, projects, and shorthand. Creates a self-contained `.tasks/` folder (TASKS.md,
  CLAUDE.md working memory, memory/ deep store, and a branded dashboard.html) so nothing
  clutters the repo root, then optionally scans connected tools (Slack, Asana/Linear/Jira,
  Microsoft 365 / Google, Notion) to seed memory. Trigger even when the user doesn't say
  "tasks" but clearly wants to start tracking work or onboard Claude to their workplace
  language. Pairs with tasks-create, tasks-update, tasks-management, tasks-memory, and
  tasks-remove.
---

# /tasks-start

Stand up the task + memory system inside a single self-contained folder, then open the
dashboard. Everything the system owns lives under **`.tasks/`** in the current working
directory — nothing is scattered across the repo root.

## Why a dedicated folder

The whole system is contained in one place so it's obvious what belongs to it, easy to
point the dashboard at, and trivial to tear down later (see `/tasks-remove`). When the
user is done, `/tasks-remove` flattens the useful parts (working memory, deep memory) back
into the repo's own `CLAUDE.md` and `memory/` and deletes `.tasks/`.

```
.tasks/
  TASKS.md          ← the task list (board + list view)
  MILESTONES.md     ← milestones (dated epics); tasks join one with an (ms #id) tag
  tasks/            ← per-task detail files <id>.md (handoff, verification, activity)
  milestones/       ← per-milestone detail files <id>.md
  CLAUDE.md         ← working memory / hot cache (the dashboard's Memory tab reads this)
  memory/           ← deep memory
    glossary.md
    people/
    projects/
    context/
  secure/           ← gitignored private store: secrets + notes that must never be committed
  config.json       ← persisted setup choices + durable project-facing board title
  board-config.js   ← generated title companion for localhost and file:// dashboard modes
  .board-version.json ← tracked version marker for the copied dashboard + server bundle
  .gitignore        ← scoped ignore: secure/ + runtime files (always scaffolded)
  dashboard.html    ← the SHAUGHV-branded UI (served on localhost; file:// fallback)
  board-server.mjs  ← zero-dep Node server: serves the dashboard + live-syncs TASKS.md
```

> `.tasks/CLAUDE.md` is the task system's **private** working memory — distinct from any
> repo-root `CLAUDE.md`. Keeping it scoped means the system stays self-contained until the
> user explicitly promotes it with `/tasks-remove`.

## Instructions

### 1. Check what exists (current dir, then ancestors)

First look in the **current working directory** for a `.tasks/` folder:

- **`.tasks/` in cwd** → already set up here. Load current state — read `.tasks/TASKS.md`,
  `.tasks/MILESTONES.md`, `.tasks/CLAUDE.md`, and `.tasks/memory/`; read `.tasks/config.json`
  for the persisted setup choices (git tracking, hooks target) — **the resume path never
  re-asks anything recorded there**; and for **every task in the Active column** read its
  `.tasks/tasks/<id>.md`: TT;DR, Acceptance, unresolved Verification, current Evidence,
  latest material Attempts row, Status, and the most-recent Activity line. Resume from the
  exact next bounded action; retrieve bulky linked evidence only for a named question. For any
  milestone past its `(target …)` date with open children, read its
  `.tasks/milestones/<id>.md` `## Status` too. Then continue through **step 2 (repair /
  upgrade) before step 3** — step 2 is mandatory on every run, including resumes.
  `/tasks-start` is idempotent and doubles as "relaunch / repair my board." Re-verify the
  hook in step 4 too (safe to re-run), ensure repo instructions in step 5, and lead your
  orientation in step 6 with "here's where we left off."

  **Migration for boards that predate `config.json`:** if it's missing, do **not** ask —
  infer and backfill silently, the way the board backfills missing ids. Infer `git`: not a
  git repo → `"none"`; the repo-root `.gitignore` has a `.tasks/` line → `"ignored"`;
  otherwise → `"tracked"`. Write `config.json` with the inferred value. While here,
  idempotently scaffold anything an older install lacks — `.tasks/.gitignore`, `secure/`,
  `MILESTONES.md`, `milestones/` — as additive repair (like re-verifying hooks), never a
  question. Reconcile drift: if `config.json` says `"ignored"` but the root `.gitignore`
  lost its `.tasks/` line, re-add it.

If there's no `.tasks/` in cwd, **walk up the parent directories** (to the repo root / a
filesystem boundary) and look for an ancestor `.tasks/`:

- **An ancestor has one (cwd doesn't)** → there's a nesting choice to make. Don't guess —
  ask the operator:

  > A task board already exists at `<ancestor>/.tasks/`. Do you want to:
  >  (a) use / update that parent board, or
  >  (b) create a new, separate board here in `<cwd>`?

  - (a) → operate on the ancestor `.tasks/` (load it, then run step 2 against it before step 3).
  - (b) → fresh setup here (a nested `.tasks/`); note the parent exists so it's intentional.

- **No `.tasks/` anywhere up the tree** → fresh first-run setup; continue to step 2.

### 2. Create, repair, and upgrade (every run)

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
  `<assets-dir>/dashboard.html`, `<assets-dir>/board-server.mjs`, and
  `<assets-dir>/board-version.json`; the target paths are `.tasks/dashboard.html`,
  `.tasks/board-server.mjs`, and `.tasks/.board-version.json`. The `.mjs` is the
  zero-dependency Node server that serves the dashboard on localhost and live-syncs the
  board (see [`references/board-server.md`](references/board-server.md)). Determine the
  target version from `.tasks/.board-version.json`, falling back to the first valid semantic
  `pluginVersion` in `.tasks/config.json` and `.tasks/.install-manifest.json`.
  - Fresh/missing/invalid target version, or source version **newer** → copy all three files
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

  Reconcile this scoped file on upgrades. Deliberately **not** ignored: `dashboard.html`, `board-server.mjs`, `board-config.js`, and
  `.board-version.json` — on a tracked board they're committed so collaborators who clone get
  a working, project-named, version-identifiable board with zero plugin install
  (`node .tasks/board-server.mjs ensure`).
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
  (so `/tasks-remove` can fully undo it). **It always succeeds**: the shipped tier provisions all
  11 pinned assets from the plugin with no network, including Makira and Gail Rock weights 400,
  500, 600, and 700. The true zero-asset floor keeps the board functional with system fallbacks.
  Upgrades replace a stale `fonts.css` and remove the retired plugin-owned IBM Plex Mono and
  Unbounded font directories. It prints a one-line `tier=…` summary you can surface in step 10.
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
  in steps 7–9 after the board is up. The install manifest (above) and the board hooks
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
bootstrap](references/board-server.md#global-node-bootstrap): detect Node, obtain authority for
machine-wide installs, record successful provisioning, and use its guarded static fallback.

### 3. Launch the live board (localhost)

If `node` is on PATH, start the live server and open it in the browser:

```
node .tasks/board-server.mjs ensure --open
```

This starts a detached, zero-dependency Node server, opens the operator's browser to it,
and live-syncs `.tasks/TASKS.md` both ways — the agent edits the file, the operator edits
the UI, and every open tab sees the same changes immediately (no manual file picking). The
source line under the project title shows a compact canonical path; hovering it shows the full
task-file path and localhost origin. The dashboard verifies that every task response and write
still belongs to that board, and refuses a write if a stale tab's port now belongs to another
project.

**The port is per-board, never assumed.** The default is 4317, but if that port is busy —
including when **another repo's board** is already running on it — this board takes the
next free port. `ensure` verifies identity, not just liveness: a responding server must
report *this* repo's `.tasks/` path, or it's treated as a foreign board and a separate
server is started. After `ensure`, read the actual port from `.tasks/.board-server.json`
(`{port, pid, ...}`) — or run `node .tasks/board-server.mjs status` — and print **that**
URL. Multiple boards on one machine at once is a normal, supported setup; see the
`tasks-boards` skill for the full multi-board rules.

> Your live task board is at **http://localhost:<port>** (opening it now). Light (vintage) /
> dark (brutalist) theme toggle is in the top-right.

**No Node?** Use the read/edit-only static flow: open `.tasks/dashboard.html`, then **Select TASKS.md** → `.tasks/TASKS.md` and **Select Folder** → `.tasks/`. The dashboard
uses the File System Access API, but completion and deletion stay locked because a browser
cannot atomically bind their detail-file changes to the `TASKS.md` lifecycle write.

### 4. Wire the board-maintenance hooks (ask once)

So every future Claude session in this repo keeps the board honest — and the operator keeps
continuous visibility — offer to install a small set of Claude Code hooks:

> Want me to add hooks so any Claude session here is reminded to keep `.tasks/TASKS.md`
> current — at session start, after commits/pushes, and around subagents — and so the live
> board auto-revives if it isn't running? Removed cleanly by `/tasks-remove`. (yes/no)

If yes, merge the hook block from
[`references/board-server.md`](references/board-server.md) into the repo's Claude settings:

- Target the file that matches the git choice recorded in `.tasks/config.json`:
  **`.claude/settings.json`** when `"git": "tracked"` (a shared board deserves a shared
  reminder), **`.claude/settings.local.json`** when `"git"` is `"ignored"` or `"none"`
  (personal, gitignored). The operator can override; record the actual target in
  `config.json` as `"hooks": "shared"` or `"local"`.
- **Merge, don't clobber:** read the file if it exists (else `{}`), preserve every existing
  key and hook, and append only our entries. Each command carries the marker
  `board-server.mjs hook` so `/tasks-remove` can find and remove exactly them.

Skip silently if the user declines — the board still works, it just won't self-maintain.

### 5. Ensure repo instructions mention the task system

On every setup or relaunch, check the target repo's **root `CLAUDE.md` and `AGENTS.md`**. These
files are what future agents read before they discover `.tasks/`, so they need a concise
top-level description of how this repo uses the task system.

- Read both files if they exist. If one is missing, treat it as needing the section.
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

This repo uses the SHAUGHV `tasks-*` system. The board source of truth is
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

### 6. Orient the user

If everything was already initialized (the relaunch path), **lead with where we left off** — a
short summary built from the state you loaded in step 1: the **Active** tasks and, for each, its
acceptance state, unresolved Verification, current Evidence receipt, latest material Attempt or
failed-route/re-entry condition, `## Status`, and exact next action; then anything overdue or due
today. Do not replay the full chronology or load bulky evidence without a named question. This is
what makes "resume days later, mid-task" the default:

```
Here's where we left off:
- <Active task> — <verified state; unresolved gate/route; next bounded action>
- … (overdue / due-today items next)

Task system loaded from .tasks/. Live board: http://localhost:<port from .tasks/.board-server.json>
- /tasks-update           sync tasks, triage stale items, fill memory gaps
- /tasks-update --comprehensive   deep scan chat/email/calendar/docs for missed todos
- /tasks-remove           decommission, remove the board hooks, fold memory into the repo
```

If the memory marker still reads `<!-- tasks-bootstrap: pending -->`, continue to step 7 (offer
to finish the bootstrap); if it reads `done`, skip it.

### 7. Bootstrap memory (first run only)

Only if the `.tasks/CLAUDE.md` marker still reads `<!-- tasks-bootstrap: pending -->` (the
skeleton from step 2 exists, but the real shorthand hasn't been decoded yet). The best source of
workplace language is the user's real task list — real tasks carry real shorthand.

**Ask the user:**

```
Where do you keep your todos? A local file, or an app (Asana, Linear, Jira, Notion,
Todoist)? I'll use your tasks to learn your workplace shorthand.
```

**Once you have the list**, analyze each item for shorthand — names that might be
nicknames, acronyms/abbreviations, project references or codenames, internal jargon — and
decode interactively:

```
Task: "Send PSR to Todd re: Phoenix blockers"

A few terms I want to get right:
1. PSR    — what does this stand for?
2. Todd   — who is Todd? (full name, role)
3. Phoenix — project codename? what's it about?
```

Only ask about terms you haven't already decoded. See `tasks-memory` for the full model.

### 8. Optional comprehensive scan

After decoding the task list, offer:

```
Want me to scan your messages, email, calendar, and docs to build richer context about the
people, projects, and terms in your work? Takes longer, but the memory is much deeper.
```

If yes, gather from connected tools — chat (Slack), email/calendar (Microsoft 365 /
Google), docs (Notion / Drive), project tracker (Asana / Linear / Jira). Present findings
grouped by confidence: **Ready to add** (offer to add directly), **Needs clarification**
(ask), **Low frequency** (note for later).

### 9. Write memory files

From everything gathered, fill in the skeleton created in step 2 (formats in `tasks-memory`):

- **`.tasks/CLAUDE.md`** — working memory (~50–80 lines): Me, People, Terms, Projects,
  Preferences.
- **`.tasks/memory/glossary.md`** — the full decoder ring.
- **`.tasks/memory/people/{name}.md`**, **`projects/{name}.md`**, **`context/company.md`**.
- **Flip the bootstrap marker** on the first line of `.tasks/CLAUDE.md` from
  `<!-- tasks-bootstrap: pending -->` to `<!-- tasks-bootstrap: done -->`, so a future
  `/tasks-start` knows the memory was decoded and skips the interactive bootstrap.

Name memory files in kebab-case (`todd-martinez.md`, `project-phoenix.md`) per Emmett's
naming conventions.

### 10. Report

```
Task system ready in .tasks/:
- Title:      <config.json boardTitle>
- Tasks:      .tasks/TASKS.md (X items)
- Milestones: .tasks/MILESTONES.md (X)
- Memory:     X people, X terms, X projects
- Tracking:   git=tracked (shared) | git=ignored (local) | git=none   (from config.json)
- Secure:     .tasks/secure/ (gitignored — secrets and private notes go here, never in tasks/memory)
- Board:      live at http://localhost:<port> (from .tasks/.board-server.json — never assume 4317)
- Assets:     tier=<full|vendor|shipped|offline> (from the install summary)
- Hooks:      board-maintenance hooks added to .claude/settings.json|settings.local.json (or skipped)

Use /tasks-create to add scoped milestones/tasks/subtasks with explicit finish lines and
verification checklists,
/tasks-update to keep it all current (add --comprehensive for a deep scan), or
/tasks-remove to remove the hooks and fold memory back into the repo when you're done.
```

## Notes

- If the system is already initialized, this just relaunches the live board (and re-verifies
  the hooks) — it's safe to re-run as your "open my board" command.
- **Multiple boards can run on one machine at the same time** (one per repo). Always resolve
  *this* repo's board via `.tasks/.board-server.json` / `board-server.mjs status` in the
  repo you're working in — never by guessing a port. Full rules: the `tasks-boards` skill.
- Nicknames are critical — always capture how people are actually referred to.
- If a connector isn't available, skip it and note the gap; the system works fully manual.
- Memory grows organically through conversation after bootstrap.
- This system tracks finite attention as well as tasks — when the user is overloaded or
  unsure what to do first, lean on the `personal-productivity` skill if it's installed;
  otherwise triage inline: lead with overdue / due-today, then decide what to drop, defer,
  or delegate.
