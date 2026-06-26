# Human Changelog

A plain-English companion to [CHANGELOG.md](./CHANGELOG.md). Every change in the technical changelog has a layman's-terms version here. No version numbers, no code references — just what changed and why.

For the technical version with versions, file paths, and links, see CHANGELOG.md.

---

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
