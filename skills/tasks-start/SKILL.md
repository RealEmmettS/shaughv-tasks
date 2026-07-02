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
  config.json       ← persisted setup choices (git tracking, hooks target) — ask once, remember forever
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
  `.tasks/tasks/<id>.md` (`## Status` + the most-recent `## Activity` line) so you can resume
  mid-task. For any milestone past its `(target …)` date with open children, read its
  `.tasks/milestones/<id>.md` `## Status` too. Then skip straight to **step 3 (Launch the
  live board)** — `/tasks-start` is idempotent and doubles as "relaunch / repair my board."
  Re-verify the hook in step 4 too (safe to re-run), ensure repo instructions in step 5, and
  lead your orientation in step 6 with "here's where we left off."

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

  - (a) → operate on the ancestor `.tasks/` (load it, then go to step 3 against it).
  - (b) → fresh setup here (a nested `.tasks/`); note the parent exists so it's intentional.

- **No `.tasks/` anywhere up the tree** → fresh first-run setup; continue to step 2.

### 2. Create what's missing

Create the `.tasks/` folder and populate it:

- **`.tasks/TASKS.md`** — if absent, create with the standard template (see the
  `tasks-management` skill).
- **`.tasks/MILESTONES.md`** — if absent, create with the `# Milestones` skeleton (see
  `tasks-management`).
- **`.tasks/dashboard.html`** and **`.tasks/board-server.mjs`** — copy BOTH from
  `${CLAUDE_PLUGIN_ROOT}/skills/tasks-start/assets/` into `.tasks/`. The `.mjs` is the
  zero-dependency Node server that serves the dashboard on localhost and live-syncs the
  board (see [`references/board-server.md`](references/board-server.md)). **Refresh is
  upgrade-only:** when the files already exist (a relaunch, or a tracked board someone else
  scaffolded), overwrite them only if the plugin's version is *newer* than the copy's
  (compare `.claude-plugin/plugin.json` under `${CLAUDE_PLUGIN_ROOT}` against the
  `pluginVersion` in `.tasks/.install-manifest.json`, falling back to `config.json`'s
  `pluginVersion`). Never downgrade — on a shared board, operators on older plugin versions
  must not flip committed board assets backwards.
- **`.tasks/.gitignore`** — always scaffold (both git modes), with exactly:

  ```
  secure/
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

  Deliberately **not** ignored: `dashboard.html` and `board-server.mjs` — on a tracked
  board they're committed so collaborators who clone get a working board with zero plugin
  install (`node .tasks/board-server.mjs ensure`).
- **`.tasks/secure/`** — create the directory with a short local `secure/README.md`
  explaining the convention (it's gitignored, so it exists only for someone browsing the
  folder; the committable pointer lives in `.tasks/CLAUDE.md` — see `tasks-memory`).
- **`.tasks/config.json`** — write eagerly as part of the persistent skeleton, with a safe
  floor:

  ```json
  { "schemaVersion": 1, "git": "ignored", "hooks": "local",
    "createdAt": "<today>", "pluginVersion": "<from the plugin's plugin.json>" }
  ```

  `"ignored"` is the conservative floor (nothing gets committed by accident); the ask-once
  question below corrects it. If the folder isn't inside a git repo at all, write
  `"git": "none"` and skip that question entirely.
- **Provision the board's display dependencies (tiered).** Immediately after copying the
  assets — and **before** launching the server in step 3 — run the internal installer once:

  ```
  node .tasks/board-server.mjs install
  ```

  This is an **internal subcommand, not a user-facing command** — never tell the user to run
  it. It provisions the board's optional enhancement assets (the anime.js motion driver, the
  vendored brand fonts, the animated brand mark) into `.tasks/vendor/` using a
  **try-everything chain** — npm → pinned CDN fetch → the plugin's shipped copies → a fully
  offline floor — and writes `.tasks/.install-manifest.json` recording exactly what it did
  (so `/tasks-remove` can fully undo it). **It always succeeds**: the board looks and behaves
  identically at every tier; lower tiers just source fewer bytes externally (Makira, a
  commercial font, is never bundled and falls back to the system stack offline). It prints a
  one-line `tier=…` summary you can surface in step 10. Re-running it is safe and idempotent.
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

Both the installer above and the live board in step 3 need **`node` on PATH**. Decide once,
here, before running `install`:

- **Node present** (`node --version` succeeds) → run `install`, then step 3 launches the
  server normally. This is the common case.
- **Node absent** → the board can't run as a server at all, so try to provision Node, in
  this order, non-interactively, and pick whatever the platform offers:
  - **Windows:** `winget install --id OpenJS.NodeJS.LTS -e --silent --accept-package-agreements --accept-source-agreements`
  - **macOS:** `brew install node`
  - **Linux:** `nvm install --lts` if nvm is present, else `sudo -n apt-get install -y nodejs npm` only if passwordless sudo works.

  Installing Node is a **global, out-of-tree change** — it can affect the whole machine.
  Mention it before doing it ("Node isn't installed; the live board needs it — want me to
  install the Node LTS via winget?") unless the user has already said to just make it work.
  If you do install it, tell `install` to record the change so it can be cleanly reversed
  later:

  ```
  node .tasks/board-server.mjs install --node-bootstrap "winget:OpenJS.NodeJS.LTS"
  ```

  (Use `brew:node`, `apt:nodejs`, or `nvm:lts` for the other managers; the installer writes
  the matching reverse command into the manifest so `/tasks-remove` can offer to undo it.)
- **Node still unavailable** (no installer, or it failed/needs UAC) → fall back to the
  **static `file://` flow** in step 3. The board works fully without Node — it just loses
  the live two-way sync and runs from the bundled offline assets + system fonts. Never block
  setup on Node.

### 3. Launch the live board (localhost)

If `node` is on PATH, start the live server and open it in the browser:

```
node .tasks/board-server.mjs ensure --open
```

This starts a detached, zero-dependency Node server, opens the operator's browser to it,
and live-syncs `.tasks/TASKS.md` both ways — the agent edits the file, the operator edits
the UI, and each sees the other's changes immediately (no manual file picking).

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

**No Node?** Fall back to the static flow: tell the user to open `.tasks/dashboard.html`
from their file browser, then **Select TASKS.md** → `.tasks/TASKS.md` and **Select Folder**
→ `.tasks/` for the Memory tab. (The dashboard auto-detects `file://` and uses the File
System Access API.)

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
- The section should explain:
  - `.tasks/TASKS.md` is the board/list source of truth; `.tasks/MILESTONES.md` holds the
    milestones (dated epics) that tasks join with an `(ms #id)` tag.
  - `.tasks/tasks/<id>.md` holds each task's rich handoff, `## Verification` checklist,
    `## Status`, and `## Activity`.
  - Proper subtasks are the dashboard modal's **Subtasks** items / indented checkbox rows in
    `TASKS.md`, not "sub-items" and not plain checklist text buried in the parent description.
  - Subtasks can have their own indented description lines for agent-facing detail:
    `    > detail for this subtask`.
  - Parent task descriptions are for reasoning, implementation sequence, context, impact,
    acceptance, and resume notes.
  - Large dependent work should be a separate top-level task linked with `(needs #id)`.
  - Completion gates: a task can't be done over unchecked subtasks, or over `[ ]`
    verification items (verify or waive-with-reason first); a milestone can't close over
    open child tasks.
  - **Secrets never go in `TASKS.md`, detail files, `CLAUDE.md`, or `memory/`** — use env
    vars / the OS keychain, or `.tasks/secure/` (gitignored) as the fallback.
  - On a shared (git-tracked) board: attribute `## Activity` lines, respect `(owner name)`,
    pull before board sessions and commit after meaningful task changes.
  - Keep Active task `## Status` and `## Activity` current as work happens so `/tasks-start`
    can resume from the board.
  - Multiple boards can run on one machine: resolve this repo's board from
    `.tasks/.board-server.json` and verify identity before using a board URL/API — never
    assume a port (see `tasks-boards`).
  - Reference `tasks-start`, `tasks-create`, `tasks-management`, `tasks-update`,
    `tasks-memory`, `tasks-boards`, and `tasks-remove`; mention companion skills such as
    `ttdr`, `personal-productivity`, `iterative-plan`, or `git-workflow` only as optional
    if installed.

Suggested section:

```markdown
## Task management system

This repo uses the SHAUGHV `tasks-*` system. The board source of truth is
`.tasks/TASKS.md`; milestones (dated epics) live in `.tasks/MILESTONES.md` and tasks join
one with an `(ms #id)` tag; each task's rich handoff lives at `.tasks/tasks/<id>.md` with
its `## Verification` checklist, `## Status`, and `## Activity` kept current while work is
in flight.

Use proper subtasks for small required steps that should be visible and checkable in the
dashboard modal: indented checkbox rows under the parent task in `.tasks/TASKS.md`, optionally
followed by indented description lines (`    > detail for this subtask`). Do not bury those
board-trackable steps as plain text in the parent task description, and do not call them
"sub-items." Use the parent description for reasoning, context, plan, impact, acceptance, and
resume notes. If related work is large enough to need its own status, activity log, or owner,
make it a separate top-level task and link it with `(needs #id)`.

Completion gates (board-enforced): a task can't be marked done while a subtask is unchecked,
or while a `## Verification` item is still `[ ]` — verify it or waive it with a recorded
reason (`(waived YYYY-MM-DD — agent: <why>)`); a milestone can't close while a child task is
open. Use `/tasks-create` for a guided way to add a milestone, task, or subtask with a
verification checklist.

Never put secrets (API keys, tokens, credentials) in `TASKS.md`, detail files, `CLAUDE.md`,
or `memory/` — use env vars / the OS keychain, or `.tasks/secure/` (gitignored).

The live board's port is per-repo, never assumed: resolve it from
`.tasks/.board-server.json` (or `node .tasks/board-server.mjs status`) and verify identity
before using a board URL or API — multiple boards can run on this machine at once (see
`tasks-boards`).

Relevant skills: `tasks-start`, `tasks-create`, `tasks-management`, `tasks-update`,
`tasks-memory`, `tasks-boards`, `tasks-remove`. Companion skills such as `ttdr`,
`personal-productivity`, `iterative-plan`, or `git-workflow` are optional if installed.
```

### 6. Orient the user

If everything was already initialized (the relaunch path), **lead with where we left off** — a
short summary built from the state you loaded in step 1: the **Active** tasks and, for each, its
`## Status` / latest `## Activity` (exactly where it stands and the next step), then anything
overdue or due today. This is what makes "resume days later, mid-task" the default:

```
Here's where we left off:
- <Active task> — <where it stands; next step>   (from .tasks/tasks/<id>.md)
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
- Tasks:      .tasks/TASKS.md (X items)
- Milestones: .tasks/MILESTONES.md (X)
- Memory:     X people, X terms, X projects
- Tracking:   git=tracked (shared) | git=ignored (local) | git=none   (from config.json)
- Secure:     .tasks/secure/ (gitignored — secrets and private notes go here, never in tasks/memory)
- Board:      live at http://localhost:<port> (from .tasks/.board-server.json — never assume 4317)
- Assets:     tier=<full|vendor|shipped|offline> (from the install summary)
- Hooks:      board-maintenance hooks added to .claude/settings.json|settings.local.json (or skipped)

Use /tasks-create to add milestones/tasks/subtasks with verification checklists,
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
