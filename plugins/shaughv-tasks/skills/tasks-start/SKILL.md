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
  language. Pairs with tasks-update, tasks-management, tasks-memory, and tasks-remove.
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
  CLAUDE.md         ← working memory / hot cache (the dashboard's Memory tab reads this)
  memory/           ← deep memory
    glossary.md
    people/
    projects/
    context/
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
  `.tasks/CLAUDE.md`, and `.tasks/memory/`, and for **every task in the Active column** read
  its `.tasks/tasks/<id>.md` (`## Status` + the most-recent `## Activity` line) so you can
  resume mid-task. Then skip straight to **step 3 (Launch the live board)** — `/tasks-start`
  is idempotent and doubles as "relaunch / repair my board." Re-verify the hook in step 4 too
  (safe to re-run), and lead your orientation in step 5 with "here's where we left off."

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
- **`.tasks/dashboard.html`** and **`.tasks/board-server.mjs`** — copy BOTH from
  `${CLAUDE_PLUGIN_ROOT}/skills/tasks-start/assets/` into `.tasks/`. The `.mjs` is the
  zero-dependency Node server that serves the dashboard on localhost and live-syncs the
  board (see [`references/board-server.md`](references/board-server.md)).
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
  one-line `tier=…` summary you can surface in step 9. Re-running it is safe and idempotent.
- **`.tasks/CLAUDE.md` + `.tasks/memory/` (scaffold now, enrich later)** — if absent, this is
  a fresh setup. Create the persistent skeleton **immediately**, before any interactive
  bootstrapping, so a durable memory + config scaffold exists even if the operator stops here:
  - `.tasks/CLAUDE.md` — the working-memory skeleton (the `tasks-memory` shape: `## Me`,
    `## People`, `## Terms`, `## Projects`, `## Preferences`, with empty tables), and a marker
    comment as the very first line: `<!-- tasks-bootstrap: pending -->`.
  - `.tasks/memory/` — `glossary.md` (with its section headers) plus `people/`, `projects/`,
    and `context/` directories (drop a `.gitkeep` in each so the empty tree persists if the
    operator commits `.tasks/`).

  The actual *enrichment* (decoding the operator's real shorthand) still happens interactively
  in steps 6–8 after the board is up. The install manifest (above) and the board hooks
  (step 4) are the rest of the persistent **configuration** — all created before the Q&A, so
  the task list + memory + config are guaranteed to exist on every init.

Use `.tasks/.gitignore` judgment: by default the system is local scaffolding. If the user
wants the task list and memory committed, leave it tracked; if they want it ephemeral, add
a `.tasks/` line to the repo's `.gitignore`. Ask once if it isn't obvious.

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

This starts a detached, zero-dependency Node server (default `http://localhost:4317`),
opens the operator's browser to it, and live-syncs `.tasks/TASKS.md` both ways — the agent
edits the file, the operator edits the UI, and each sees the other's changes immediately
(no manual file picking). Always print the URL too, in case auto-open can't reach the
browser (e.g. a Cowork VM):

> Your live task board is at **http://localhost:4317** (opening it now). Light (vintage) /
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

- Target `.claude/settings.local.json` by default (personal, gitignored — matches `.tasks/`
  being local scaffolding). Use `.claude/settings.json` only if `.tasks/` was committed in
  step 2 and the user wants the reminder shared with collaborators.
- **Merge, don't clobber:** read the file if it exists (else `{}`), preserve every existing
  key and hook, and append only our entries. Each command carries the marker
  `board-server.mjs hook` so `/tasks-remove` can find and remove exactly them.

Skip silently if the user declines — the board still works, it just won't self-maintain.

### 5. Orient the user

If everything was already initialized (the relaunch path), **lead with where we left off** — a
short summary built from the state you loaded in step 1: the **Active** tasks and, for each, its
`## Status` / latest `## Activity` (exactly where it stands and the next step), then anything
overdue or due today. This is what makes "resume days later, mid-task" the default:

```
Here's where we left off:
- <Active task> — <where it stands; next step>   (from .tasks/tasks/<id>.md)
- … (overdue / due-today items next)

Task system loaded from .tasks/. Live board: http://localhost:4317
- /tasks-update           sync tasks, triage stale items, fill memory gaps
- /tasks-update --comprehensive   deep scan chat/email/calendar/docs for missed todos
- /tasks-remove           decommission, remove the board hooks, fold memory into the repo
```

If the memory marker still reads `<!-- tasks-bootstrap: pending -->`, continue to step 6 (offer
to finish the bootstrap); if it reads `done`, skip it.

### 6. Bootstrap memory (first run only)

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

### 7. Optional comprehensive scan

After decoding the task list, offer:

```
Want me to scan your messages, email, calendar, and docs to build richer context about the
people, projects, and terms in your work? Takes longer, but the memory is much deeper.
```

If yes, gather from connected tools — chat (Slack), email/calendar (Microsoft 365 /
Google), docs (Notion / Drive), project tracker (Asana / Linear / Jira). Present findings
grouped by confidence: **Ready to add** (offer to add directly), **Needs clarification**
(ask), **Low frequency** (note for later).

### 8. Write memory files

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

### 9. Report

```
Task system ready in .tasks/:
- Tasks:   .tasks/TASKS.md (X items)
- Memory:  X people, X terms, X projects
- Board:   live at http://localhost:4317 (node .tasks/board-server.mjs)
- Assets:  tier=<full|vendor|shipped|offline> (from the install summary)
- Hooks:   board-maintenance hooks added to .claude/settings.local.json (or skipped)

Use /tasks-update to keep it current (add --comprehensive for a deep scan), or
/tasks-remove to remove the hooks and fold memory back into the repo when you're done.
```

## Notes

- If the system is already initialized, this just relaunches the live board (and re-verifies
  the hooks) — it's safe to re-run as your "open my board" command.
- Nicknames are critical — always capture how people are actually referred to.
- If a connector isn't available, skip it and note the gap; the system works fully manual.
- Memory grows organically through conversation after bootstrap.
- This system tracks finite attention as well as tasks — when the user is overloaded or
  unsure what to do first, lean on the `personal-productivity` skill if it's installed;
  otherwise triage inline: lead with overdue / due-today, then decide what to drop, defer,
  or delegate.
