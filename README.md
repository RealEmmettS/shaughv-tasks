# shaughv-tasks

**Pick up the work. Keep the context.**

A task board and project memory for working with Codex. See what's moving, what is
blocked, and what comes next—then come back in a new chat without rebuilding the plan.

Your tasks, notes, decisions, and completion checks live with your project as readable
Markdown files. You and your agent work from the same record. The local dashboard turns
that record into a workspace you can browse, edit, and organize.

![The task board with search, milestones, and task details beside the work](docs/images/task-board.jpg)

*A local demo board with fictional tasks.*

[Get started with Codex](#get-started-with-codex) · [Use with ChatGPT](#take-the-context-into-chatgpt) · [Other agents](#other-ways-to-install)

## A place for the work between chats

You finish a session with a few changes made, an unresolved check, and a clear next step.
The next chat should start there.

shaughv-tasks keeps that handoff in the project. Each task can hold its purpose, steps,
current status, evidence, and what to try next. Shared workplace memory keeps track of
the people, project names, and shorthand you would otherwise explain again.

- **Find your next move.** Search by title, context, person, subtask, or task ID. Filter
  by owner or by open, active, blocked, and completed work.
- **Plan at the right scale.** Capture a task in a few words, break it into subtasks,
  or group a larger outcome into a dated milestone.
- **Keep the board in view.** Open task details beside your work on a wide screen.
  Switch to a list for a tighter view; narrow screens start there.
- **Make dependencies clear.** Choose prerequisites by name and open the task holding
  things up. Milestone progress updates from its child tasks.
- **Know what “done” means.** The live board checks prerequisites, subtasks, and saved
  verification before completing a task. Unavailable evidence stays visible as unfinished work.
- **Carry the context forward.** Copy a task handoff into another Codex or ChatGPT chat,
  with the saved notes and checks that matter to that task.

The interface uses SHAUGHV's Makira and Gail Rock typefaces, light and dark appearances,
and small transitions that make changes easier to follow. It respects reduced-motion
preferences and bundles its fonts and display scripts for local use.

## Get started with Codex

You need Codex with plugin support and Node.js available for the live board.

Add the marketplace and install the plugin:

```bash
codex plugin marketplace add RealEmmettS/shaughv-tasks
codex plugin add shaughv-tasks@shaughv-tasks
```

Open your project in Codex and ask:

> Use tasks-start to set up a task board for this project.

Codex creates a `.tasks/` folder, asks once whether to keep it local or track it in Git,
and opens your board. Existing boards resume with their saved tasks and settings.
Optional hooks help the agent find the board again; the core workflow works without them.

Then try:

> Add a task to finish the onboarding flow, with subtasks for the welcome screen and first-run checks.

> What is blocked, and what can I move forward today?

> Open my board and show me where we left off.

You can also choose **tasks-start**, **tasks-create**, **tasks-update**, or **tasks-remove**
from the skills available in your host. The other three skills supply the shared rules
for task files, workplace memory, and finding the correct board.

## Use the board your way

**Capture first, add detail when needed.** Use **New task** in either layout, or press
`N` when you're not typing in a field. Press `/` to search. Open a task to add context,
an owner, prerequisites, subtasks, and completion checks.

**Watch and work in the same place.** The agent can update the Markdown while you use
the board. Live tabs pick up file changes. If an open task contains a draft, the board
keeps your editing context and tells you when it needs a refresh.

**Choose the view that fits.** Board shows the flow from Backlog through Completed.
List makes longer queues easier to scan. Your layout choice is remembered for that board.
Filters include a visible result count and a single way to clear them.

**Keep useful context close.** The Memory view gives you the project's people, terms,
and notes. In task details, the current status and plan appear before the background
records, with a summary of the checks still needed to finish.

## Take the context into ChatGPT

Open a task and choose **Copy handoff**, then paste it into your ChatGPT conversation.
You can also add selected task files to a ChatGPT Project for planning or review.

The handoff includes the task ID, status, subtasks, and saved notes. ChatGPT can help
you refine the plan or prepare an update. Back in Codex, ask it to reconcile that update
with the current project files before applying it.

Live editing depends on the tools available in that session. A copied handoff or uploaded
file is a snapshot; it does not automatically synchronize with the local board.
See the [ChatGPT workflow](skills/tasks-management/references/chatgpt.md) for the details.

## Your project keeps the record

Your board data and runtime files stay under `.tasks/`:

| What you keep | Where it lives |
|---|---|
| Tasks and subtasks | `TASKS.md` |
| Milestones and target dates | `MILESTONES.md` |
| Task plans, checks, and handoffs | `tasks/` |
| Milestone notes | `milestones/` |
| Shared workplace context | `CLAUDE.md` and `memory/` |
| The dashboard and its settings | Board files and `config.json` |

The `CLAUDE.md` name is retained for compatibility. Codex reads the same shared context;
you don't need separate memory for each agent.

Keep the folder local, or track it in Git to share work across machines and collaborators.
Git sharing is asynchronous; the live board synchronizes tabs connected to the same local
server. Private material under `secure/` stays ignored and is never served by the board.

The board runs on your machine with Node's built-in libraries. It has no database to
manage and needs no separate board account. You can inspect the files in your editor,
review changes in Git, and keep using the record across sessions.

## Other ways to install

### Claude Code

```text
/plugin marketplace add RealEmmettS/shaughv-tasks
/plugin install shaughv-tasks@shaughv-tasks
```

Then ask for `tasks-start`, or use `/shaughv-tasks:tasks-start`.

### Other agents that support skills

```bash
npx skills add RealEmmettS/shaughv-tasks
```

This installs the skills for supported agents. A live board still needs local file
access and Node.js. Hook support depends on the host; the shared task files work without hooks.

## Keep it up to date

For Codex:

```bash
codex plugin marketplace upgrade shaughv-tasks
codex plugin add shaughv-tasks@shaughv-tasks
```

Run **tasks-start** again in an existing project to apply a newer board bundle and resume.
It preserves tasks, memory, and recorded choices, and won't downgrade a newer board.
Claude Code users can run `/plugin marketplace update`; skills CLI users can run
`npx skills update` (or `npx skills update -g` for a global install).

When you no longer need the board, **tasks-remove** prepares a plan to preserve useful
memory and open work before removing the task system.

[What's changed](HUMAN_CHANGELOG.md) · [Technical changelog](CHANGELOG.md) · [Contributing and package structure](AGENTS.md) · [Board operation details](skills/tasks-start/references/board-server.md)

Made by [Emmett Shaughnessy](https://emmetts.dev) · [SHAUGHV](https://shaughv.com/tasks)
