# Human Changelog

A plain-English companion to [CHANGELOG.md](./CHANGELOG.md). Every change in the technical changelog has a layman's-terms version here. No version numbers, no code references — just what changed and why.

For the technical version with versions, file paths, and links, see CHANGELOG.md.

---

## Milestones, checklists, and shared boards — early July 2026

**Added**
- **Milestones.** You can now group tasks under a bigger, dated goal — "ship the launch by August 1" — and watch a progress bar fill as its tasks get done. The board grew a milestone strip across the top: each milestone shows its target date and progress, you can click one to see everything inside it, and you can filter the whole board down to just that milestone's work. A milestone can't be marked finished while any of its tasks is still open, and tidying old completed tasks off the board never makes a milestone's progress go backward — finished work is remembered.
- **Verification checklists.** Every task can now carry a short list of concrete checks that must pass before it counts as done — "the tests pass," "the page loads," "you confirmed the wording." The board won't let a task be completed while a check is still open: each one has to be passed, or deliberately skipped. You can skip a check from the board with one click (it's stamped with your name and the date), but when the assistant skips one it has to write down *why*, so there's always a record of what was skipped and the reason.
- **A guided way to add work.** There's a new helper that walks through creating things properly: is this a quick step inside an existing task, a task of its own, or a whole milestone? It picks the right level with you, connects the pieces, and writes the verification checklist by default.
- **Share your board with your team — or keep it private.** The first time you set up, you're asked one question: should this board be saved into the project (so teammates and their assistants see and share the same tasks, memory, and dashboard) or kept just for you on your machine? Your answer is remembered and never asked again — reopening the board later is always instant and question-free. Shared boards even include the dashboard itself, so a teammate who downloads the project gets a working board without installing anything.
- **A safe place for secrets.** Passwords, API keys, and private notes now have a dedicated folder that is never shared or saved into the project, no matter what — and the assistant is under standing instructions to never write secrets into tasks, notes, or memory in the first place. If your board is shared, your candid personal notes go there too, so only genuinely shareable facts reach the team.
- **Tasks can name who's driving them.** On a shared board, each task can carry an owner, and assistants are told not to pick up someone else's in-progress work without checking first.

**Fixed**
- **Two boards on one computer no longer get confused.** Previously, if two projects each ran their own board, an assistant could accidentally talk to the *wrong* project's board (they both liked the same address) — and once, one actually edited the other project's tasks. Boards now identify themselves by which project they belong to, every check verifies that identity before trusting the address, and there are clear rules for assistants on finding the right board. Any number of boards can now safely run at once.
- The dashboard could previously lose custom sections an assistant had written into a task's notes when you edited that task from the board. It now preserves everything it doesn't recognize, exactly where it was.

**Improved**
- The board got a polish pass in Emmett's brand style: crisp square edges and fine borders on the new pieces, proper icons instead of emoji, and a set of small, smooth animations — progress bars sweep instead of jumping, counters roll like an odometer, and a blocked action gives a brief, honest little head-shake instead of failing silently. Everything respects reduced-motion settings.
- Each board's browser tab now shows which project it belongs to, so having two boards open never gets confusing.
- The rulebooks the assistants follow were rewritten around all of the above: the three levels of work, the completion rules, how to keep a shared board tidy across several people and assistants, and how to resolve the rare conflict when two people edited the same thing.

**Behind the scenes**
- The plugin grew from five skills to seven, and all the packaging, documentation, and the Codex copy were brought along in step.

## Clearer subtasks — late June 2026

**Improved**
- Agents now get clearer instructions about the difference between a task description, a real subtask, and a separate linked task. Small steps that should be visible on the board belong in the Subtasks area, not hidden in the task's long description.
- Subtasks can now have their own notes, so an agent can explain what a specific step means without cluttering the parent task description.
- When the task system is opened in a repo, it now makes sure that repo's own agent instructions explain how to use the task board, which skills to reference, and how to keep in-progress work resumable.
- The board treats unfinished subtasks as unfinished work when someone tries to mark the parent task done.

**Fixed**
- One example showed dependency tags in the wrong order. It now matches the format the board actually writes.

## Codex install fix — late June 2026

**Fixed**
- Codex now accepts this plugin from the GitHub marketplace URL without stopping on an invalid install metadata value. The Claude Code install path is unchanged.

## First release — late June 2026

**Added**
- This is a brand-new home for the task system. The whole "set up a task board and a memory of your people and projects" toolkit used to live inside Emmett's big all-in-one plugin; now it's its own standalone plugin you can install by itself, in whatever assistant you use. Nothing about how it works changed in the move — it's the same task board, the same live dashboard, the same memory — just packaged on its own so it's easy to install anywhere without dragging everything else along.
- It installs three ways: as a plugin in Claude Code, as a plugin in Codex, or as skills-only in any other assistant that supports them.

**Improved**
- **Your work now reliably picks back up where you left off.** Setting up the system always creates the memory and notes scaffolding right away, so even if you wander off in the middle of setup, nothing is lost. And when you come back later and reopen the board, the assistant reads what's currently in progress — and the running notes on each in-progress task — and leads with "here's where we left off," so resuming a half-finished job days later is the normal, easy case. The board itself (what's planned, what's being worked on, what's done, plus the running log on each task) is what carries that memory across days and weeks.
- The assistant is reminded to keep each in-progress task's notes and "where this stands" up to date as it works, so the board always reflects reality and a future session can step right in.

**Behind the scenes**
- The little SHAUGHV logo in the top corner of the board is now a touch bigger.
- A few places in these skills mention companion tools from Emmett's other plugin; if that other plugin isn't installed, those mentions quietly fall back to sensible built-in behavior, so this plugin works perfectly well on its own.
- The board's bundled fonts and animation files are carried over exactly, byte-for-byte, and the Codex copy of the plugin is generated and kept in step automatically.
