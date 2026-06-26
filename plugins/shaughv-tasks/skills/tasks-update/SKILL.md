---
name: tasks-update
description: >
  Sync the task list and refresh workplace memory from current activity, for repos using the
  tasks-* system. Use whenever the user says /tasks-update, "sync my tasks", "catch me up",
  "triage my tasks", "what changed", "pull in my new assignments", "what am I missing", or
  wants stale items triaged and memory gaps filled. Default mode syncs from a connected
  project tracker (Asana/Linear/Jira/GitHub Issues), triages overdue/stale items, and decodes
  tasks for memory gaps. `--comprehensive` additionally deep-scans chat, email, calendar, and
  docs to surface missed todos and suggest new memories. Operates on `.tasks/`. Reads
  tasks-management and tasks-memory.
argument-hint: "[--comprehensive]"
---

# /tasks-update

Keep `.tasks/TASKS.md` and `.tasks/memory/` current. Two modes:

- **Default** — sync tasks from connected tools, triage stale items, check memory for gaps.
- **`--comprehensive`** — also deep-scan chat / email / calendar / docs for missed todos and
  suggested new memories.

If `.tasks/` doesn't exist, suggest `/tasks-start` first.

## Default mode

### 1. Load current state

Read `.tasks/TASKS.md` and `.tasks/CLAUDE.md` + `.tasks/memory/`.

### 2. Sync tasks from external sources

Check for a connected task source:

- **Project tracker** — Asana, Linear, Jira/Atlassian, monday.com, ClickUp (whichever MCP is
  connected).
- **GitHub Issues** (if in a repo): `gh issue list --assignee=@me`, or the GitHub MCP.

Fetch tasks assigned to the user (open / in-progress) and compare against `.tasks/TASKS.md`:

| External task | In TASKS.md? | Action |
|---------------|--------------|--------|
| Found, not present | no | offer to add |
| Found, present | match by fuzzy title | skip |
| In TASKS.md, not external | no | flag as possibly stale |
| Completed externally | still Active | offer to mark done |

Present the diff; let the user decide. If no source is connected, skip to step 3.

### 3. Triage stale items

Review Active tasks and flag, leading with the most urgent:

- **Overdue** (due date in the past) and **due today**.
- Tasks in Active 30+ days with no movement.
- Tasks with no context (no person, no project).

For each: mark done? reschedule? move to Backlog? break down (hand to the `iterative-plan`
skill if installed, otherwise split it into a small, concretely demoable next action)?

### 4. Decode tasks for memory gaps

For each task, decode every entity (people, projects, acronyms, tools, links) against
memory. Track what's fully decoded vs. what has gaps:

```
Task: "Send PSR to Todd re: Phoenix blockers"
- PSR → ✓ Pipeline Status Report
- Todd → ✓ Todd Martinez
- Phoenix → ? not in memory
```

### 5. Fill gaps

Present unknown terms grouped, with the task they came from, and ask. Write answers into the
right memory file (`memory/people/`, `memory/projects/`, `memory/glossary.md`).

### 6. Capture enrichment

Tasks often carry richer context than memory has — extract and update: links → project/people
files; status changes ("launch done") → update project status and demote from the hot cache;
relationships → cross-reference people; deadlines → project files.

### 7. Report

```
Update complete:
- Tasks: +3 from tracker, 1 completed, 2 triaged (1 overdue surfaced)
- Memory: 2 gaps filled, 1 project enriched
- All tasks decoded ✓
```

## Comprehensive mode (`--comprehensive`)

Everything above, plus a deep scan.

### Scan activity sources

Gather from connected tools: **chat** (recent messages / active channels), **email** (sent
messages), **docs** (recently touched), **calendar** (recent + upcoming).

### Flag missed todos

Compare activity against `.tasks/TASKS.md` and surface untracked action items:

```
## Possible missing tasks
1. From chat (Jun 18): "I'll send the updated mockups by Friday" → add?
2. From "Phoenix Standup" (Jun 17): recurring meeting, no active Phoenix tasks → anything?
3. From email (Jun 16): "I'll review the API spec this week" → add?
```

### Suggest new memories

Surface new entities not in memory, grouped by confidence:

```
## New people (not in memory)
| Name | Frequency | Context |
|------|-----------|---------|
| Maya Rodriguez | 12 mentions | design, UI reviews |

## Suggested cleanup
- Horizon project — no mentions in 30 days. Mark completed?
```

High-confidence items offered to add directly; low-confidence asked about.

## Notes

- **Never** auto-add tasks or memories without confirmation.
- Preserve external source links when available.
- Fuzzy-match task titles to handle minor wording differences.
- Safe to run often — it only changes things when there's new info.
- `--comprehensive` always runs interactively.
