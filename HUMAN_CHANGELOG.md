# Human Changelog

A plain-English companion to [CHANGELOG.md](./CHANGELOG.md). Every change in the technical changelog has a layman's-terms version here. No version numbers, no code references — just what changed and why.

For the technical version with versions, file paths, and links, see CHANGELOG.md.

---

## A task board that reads like a product and verifies like a console — late July 2026

**Added**
- Makira and Gail Rock now travel with the board in the four weights it actually uses, so the
  intended typography stays available without a connection.

**Improved**
- Makira now carries the human layer: names, descriptions, notes, people, navigation, editable
  values, and actions. Gail Rock carries the operational layer: workflow states, labels, IDs,
  dates, counts, proof, paths, activity, freshness, and raw writing surfaces.
- Buttons read as product actions instead of terminal commands, while compact system utilities
  retain Gail Rock where its fixed rhythm makes state and technical output easier to scan.
- Both the live board and a directly opened board use the same local font files before considering
  any fallback.

**Fixed**
- An older board now receives the new type definitions on its next start instead of keeping its
  previous font setup.
- Mobile navigation now stays on-screen, and long names no longer collide with their short IDs in
  task and milestone details.

**Removed**
- The two previous board fonts and their leftover local folders are retired cleanly during an
  upgrade.

**Behind the scenes**
- The installer now tracks the complete set of fonts, motion, stylesheet, and brand assets without
  changing task data or how anyone uses the board.

## Tasks that remember proof, not chatter — late July 2026

**Added**
- Important tasks can now carry a small proof receipt: what had to be true, which real-world check
  decided it, where the raw result lives, what that result actually supports, and whether the check
  passed, failed, was not run, or could not decide.
- Uncertain or repeatedly failing tasks can keep a compact attempt record: the belief being tested,
  the action, the prediction, what really happened, what changed, and what evidence would justify
  trying that route again.
- A milestone now gets a final qualification task when finishing its ordinary children would not
  itself prove that the pieces work together or that the promised outcome is ready.

**Improved**
- Task descriptions now lead with the compact state a fresh assistant needs: objective and finish
  line, verified facts and proof, important decisions, live assumptions, failed routes, unresolved
  obligations, the stable dependency map, and the short window of actions worth detailing now.
  Each near-term action says what should be observed and when to change course; later steps stay
  coarse instead of becoming a stale master plan. Huge logs and old chronology remain available by
  link instead of flooding every resumed session.
- Long or consequential work records the source that decides current truth, what must not break,
  the early assumption most likely to invalidate later work, and the cheapest way to disprove it.
  A routine task still stays light.
- When two attempts are really the same and teach nothing, the assistant stops only that route. It
  checks the premise, observer, success test, environment, approach, and task size before choosing
  a different experiment. It distinguishes repeated words, repeated evidence, repeated actions,
  and work built on a false premise, because each needs a different recovery. Open-ended work also
  gets a finite budget or stop point. A changed result remains productive; noisy work can still use
  a declared repeat plan.
- Reopening a board now summarizes acceptance, missing checks, current proof, the latest meaningful
  attempt, failed-route conditions, and the next action. Approved future plan steps stay queued;
  only work actually underway enters Active.
- Connected trackers can still say something is complete, but the board now checks the real finish
  line before agreeing. Updates also surface persuasive “done” claims without proof, repeated
  symptom patches, contradictions nobody acted on, and reliability claims based on one run.
- Workplace memory remains useful for names and context while clearly yielding to current system
  state. Removing the board preserves the compact open-work state, not a transcript; deferred
  evidence obligations survive automatically, and you explicitly choose what happens to the rest
  of the Backlog.

**Fixed**
- An assistant can no longer skip a required check merely because it cannot run it. A skipped check
  now requires a real owner or policy decision to remove, defer, or declare it irrelevant; missing
  proof keeps the task honestly partial, blocked, or not verified.
- The dashboard itself now enforces that rule: waiving, removing, or changing any check
  requires an explicit authority acknowledgement and recorded reason; changed settled checks
  reopen; and an old reasonless waiver cannot silently unlock completion. It waits until that
  record is actually saved, rereads the durable checklist, and makes the server prove that exact
  checklist was still current when it records completion. If another person or assistant edits
  either file at the same time, one operation is refused for review instead of silently winning.
  The same guarded operation deletes a task and retires its detail together; a stale tab cannot
  erase proof for a task that survived a conflict, recreate detail after deletion, or mark a task
  complete by bypassing the receipt. Board conflicts compare the actual content, not only a
  timestamp that two rapid writes might share.
  The no-server fallback still verifies the matching task folder and refuses stale edits, but
  completion and deletion wait for the live board because a browser cannot safely commit two
  files as one.
  Switching or closing a task cannot let a late background read or save spill into the next
  task, and outside refreshes no longer erase unblurred modal drafts. A tab that loaded an older
  checklist is checked and refused when a newer agent edit is detected. Once completed, a task's
  contract and proof stay read-only until someone deliberately reopens it.
- A completion checkbox in another app no longer becomes proof by itself.

**Behind the scenes**
- The live board did not need a new screen or data format: it already preserves the new optional
  sections. Updated every installation description, portable board marker, resume instruction, and
  maintenance reminder together, and kept detailed setup mechanics in navigable optional
  guidance, without adding another helper, connection, command, or test system.

## Tasks with a finish line — late July 2026

**Improved**
- When you ask an assistant to create, plan, or scope a meaningful task, it now writes down what is included, what is deliberately deferred, what must actually work, what proof is required, and who owns any costly checks.
- If the goal is too ambitious to attack as one piece, the assistant keeps the real end goal visible but starts with the smallest end-to-end version that can actually work. It then turns hardening, integrations, polish, and final proof into clear later steps instead of mixing everything into one enormous attempt.
- Routine checks still block completion until they pass or are explicitly waived. Long soaks, exhaustive device or platform checks, and outside approvals no longer become endless blockers just because an assistant thought they might be useful: the assistant explains the time and risk, asks for a decision, and preserves deferred proof as a separately owned backlog item.
- Repeating the same failed attempt is now explicitly bounded. If two attempts produce the same evidence, the assistant must record what happened, check whether the work needs a smaller first rung, and then change the experiment, improve the error reporting, return the decision to its owner, or ask you—rather than grinding indefinitely.
- Future assistants receive this same guidance when the task system writes or refreshes a repository's working instructions, so the clearer finish line survives handoffs and new sessions.

**Behind the scenes**
- Every supported plugin install and portable board bundle now identifies this refinement as the same patch release, and the plugin catalog has a proper plain-English description.

## Drag-and-drop that lands where you point — late July 2026

**Improved**
- A brand-new board now always opens with four useful categories: **Backlog**, **To-Do**, **Active**, and **Completed**. Existing boards keep the names and arrangement people already chose, including older boards that call the last category **Done**.
- Dragging near the edge of a wide board or a long category now scrolls it for you, and categories can be dropped cleanly at the very end before the add-category button.
- Under the project name, the board now shows a compact **Live** source path; hover it when you need the full file path and local server address. A directly opened offline board says **Selected file** so it does not imply the browser revealed a path it actually hides.

**Fixed**
- Dragging a category no longer also lights up a task drop target. The board now knows which kind of thing is moving and shows only the relevant guide.
- Drop guides no longer push cards or categories around while you are aiming. The bright guide is pinned to the closest real gap, spans the category height or card width, and produces the same saved order you saw on screen—even with uneven cards, scrolling, empty categories, or a category you just created.
- Two tabs open on the same board now stay together when either tab edits it. Each tab also checks the board behind its local address before reading or writing, so an old tab cannot quietly switch to another project's tasks if that address gets reused.

**Behind the scenes**
- The portable board bundle and every supported plugin install now identify this refinement as the same patch release.

## Boards named for their projects — late July 2026

**Added**
- Every board now remembers the real project it belongs to and shows that name prominently in both the board heading and browser tab. Reopening or updating a board keeps a good title exactly as it was; older boards labeled only “Tasks” get named once and stay named.

**Improved**
- Future assistants get a clearer map of how to start, create, break down, update, resume, share, and eventually remove a board. Creating proper tasks and subtasks points to the guided helper by default, while the deeper rulebook remains easy to find.
- If an assistant's installed task helper is old or cannot be updated, it now knows how to fall back to the current GitHub guidance instead of guessing from stale instructions.

**Behind the scenes**
- The project identity lives separately from the replaceable dashboard app, so upgrades cannot accidentally wipe a carefully chosen name and direct offline opens show the same title as the live board.

## Boards that stay current — mid-July 2026

**Fixed**
- Reopening an existing board now always checks whether its built-in dashboard is behind and upgrades the whole board app together when needed. Previously, reopening could skip that check entirely, leaving some projects on an older screen without newer touches such as **Show more / Show less** for long descriptions. A newer board is still protected from being replaced by an older copy.
- Every supported assistant and installation route now has the same reliable way to identify the board version and find its fully offline visual assets, instead of sometimes recording the version as unknown.

**Behind the scenes**
- The board app now carries a tiny version marker, and the release checks make sure it can never drift away from the task-system release.

## Roomier task descriptions — early July 2026

**Improved**
- When you open a task or milestone on the board, its description now behaves itself when it gets long. Instead of stretching the whole popup and pushing everything else down, a long description tucks into a tidy box with a **Show more** / **Show less** button, and you can scroll inside it. Short descriptions look exactly as before — the button only shows up when there's actually more to see, with a soft fade at the bottom hinting there's more. This makes room for the fuller write-ups people have started putting in these boxes, not just the quick summary.

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
