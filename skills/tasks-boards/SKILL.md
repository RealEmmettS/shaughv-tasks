---
name: tasks-boards
description: >
  How agents find, verify, and talk to the RIGHT task board when more than one exists —
  multiple repos with their own .tasks/ boards running on the same machine, nested boards,
  or a board already open when the operator starts work in a new repo. Reference this
  before interacting with a live board server (reading or writing through its HTTP API, or
  telling the operator a board URL), whenever a port doesn't respond the way you expect, or
  whenever there's any chance the server on a port belongs to a different repo. Set up by
  /tasks-start; the board identity rules here are implemented by board-server.mjs.
user-invocable: false
---

# Task boards: one per repo, many per machine

A **board** is a repo's `.tasks/` folder plus (optionally) the live server that repo runs.
Any number of boards can run on the same machine at the same time — a Claude agent in one
repo and a Codex agent in another, each with their own board, is a normal, supported setup.

The one rule that prevents every cross-board accident:

> **A port is not an identity.** Never assume "my board is on 4317," and never trust that a
> server answering on some port is *your* board just because it answers like one. Resolve
> your board from *your repo's files*, and verify identity before you write through any API.

The default port is 4317, but it belongs to whoever bound it first. Every other board takes
the next free port. A board's real port lives in **its own** `.tasks/.board-server.json`.

## Finding YOUR board

1. **Resolve the `.tasks/` folder first** — from the repo you are actually working in:
   `.tasks/` in cwd, else walk up the ancestors (same rule as `/tasks-start`; if an
   ancestor board is a surprise, ask the operator which board they mean).
2. **Read `.tasks/.board-server.json`** — `{ "port": N, "pid": …, "startedAt": … }`. That
   `N` is your board's port. Equivalent: `node .tasks/board-server.mjs status` (prints the
   state if running, `{"running":false}` if not).
3. **No state file / not running?** Start it: `node .tasks/board-server.mjs ensure` — it
   binds a free port, writes the state file, and handles the foreign-board case below by
   itself. Then re-read the state file for the real port.

Never reuse a port you remember from an earlier session, another repo, or a hook message
that scrolled by — re-read the state file every time it matters.

## Verifying you're talking to the right board

`GET http://localhost:<port>/api/ping` returns the board's identity, including the
**absolute path of the `.tasks/` folder it serves** (its root). Before editing through a
board API — and any time behavior seems off — confirm that root is the `.tasks/` you mean.

- **Root matches** → proceed.
- **Root is a different repo** → that's someone else's board that happens to hold the
  port. Do not read it as yours, do not write to it, do not stop it. Run
  `node .tasks/board-server.mjs ensure` from *your* repo — it detects the foreign occupant,
  binds the next free port for your board, and records it in your state file.
- **No answer / not a shaughv board** → the state file is stale (server died, port
  recycled). Run `ensure` and re-read the state file.

`ensure` performs this same identity check internally: "already running" means *this
repo's* board is alive — a foreign board on the default port is treated as a busy port,
never as "running."

## Handling the common situations

- **Operator opens a second repo and runs `/tasks-start` while another board is up** —
  nothing special: the new board takes its own port. Report the URL from the new repo's
  state file, and say which repo it belongs to when more than one board is running
  ("this repo's board: http://localhost:4318").
- **Two agents in two repos on one machine** — each works only through its own repo's
  `.tasks/` tree and its own verified port. The files, not the servers, are each board's
  source of truth: when in doubt, edit `.tasks/TASKS.md` in your repo directly and let the
  server pick up the change.
- **Nested boards** (a repo inside a folder that also has `.tasks/`) — the `/tasks-start`
  ancestor rule applies: ask the operator which board is intended; never merge or
  cross-edit them on your own.
- **Stopping servers** — only ever `node .tasks/board-server.mjs stop` from the repo whose
  board you own. Never kill a process on a port without confirming its root: it may be
  another agent's live board.
- **Telling the operator where their board is** — always the URL from the current repo's
  state file, ideally with the repo name attached. The dashboard shows the board's folder
  name in its header/tab title, so mixed-up browser tabs are visible at a glance.

## Why this exists

A real incident: two agents (Codex and Claude) each ran a board in their own repo; both
assumed 4317; one edited the other repo's tasks through the wrong server. The identity
rules above — resolve from your own state file, verify the root, treat foreign boards as
busy ports — are what make multiple simultaneous boards safe.
