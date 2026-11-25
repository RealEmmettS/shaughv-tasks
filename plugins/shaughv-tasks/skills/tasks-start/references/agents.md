# Agent operations

Run these from the selected project. The client starts or reuses its local board and verifies its identity. Each command writes one JSON result to stdout. Errors go to stderr with a nonzero exit code.

| Action after `node .tasks/board-server.mjs agent` | Effect |
| --- | --- |
| `help` | Show the available commands and flags. |
| `read board` / `read milestones` | Return the Markdown index and its revision. |
| `read task ID` / `read milestone ID` | Return the whole Markdown record and revision, including custom sections. |
| `read memory-tree` / `read memory PATH` | List memory files or read `CLAUDE.md` or a Markdown file beneath `memory/`. |
| `create --title TITLE [--to COLUMN] [--by NAME]` | Add a task and return its generated ID. |
| `claim ID --by NAME` | Claim an unassigned open task. An existing different owner is reported. |
| `move ID --to COLUMN` | Move the task and its subtasks together. Use the column's displayed name. |
| `comment ID --by NAME --text TEXT` / `result ID --by NAME --text TEXT` | Append a timestamped entry under **Comments** or **Results**. |
| `criterion ID --text TEXT` | Add an open success criterion under **Verification**. |
| `write task ID --revision HASH --file edited.md` | Save a revised record, including criterion states, evidence, comments, and results. |
| `write board --revision HASH --file edited.md` | Edit columns, owners, tasks, subtasks, dependencies, or milestone references. |
| `complete ID` / `reopen ID` | Apply the completion checks and move the task into or out of the completion column. |
| `write board --delete ID --revision HASH --file edited.md` | Remove the named row and its associated detail in one guarded operation. |

To retire a milestone, clear its task references with a board edit, remove its index row, then remove its detail with `delete milestone ID --revision HASH`.

`write` also accepts `milestones`, `milestone ID`, or `memory PATH`. Supply the revision returned for that exact document. Input can also come from stdin. The Markdown payload is the full intended document. A conflict means someone else saved first. Read again and reconcile the changes. The local live client is preferred while other operators are editing.

Task notes are Markdown sections. A short author-attributed entry belongs in `## Comments`, an observation with an evidence pointer in `## Results`, and acceptance checks under `## Verification` as `- [ ]` or `- [x]`. Preserve all custom sections. Keep project secrets in the project's existing secret store or its ignored `.tasks/secure/` folder.

[Task formats](../../tasks-management/references/formats.md) · [Completion and evidence](../../tasks-management/references/task-records.md) · [Server API](board-server.md)
