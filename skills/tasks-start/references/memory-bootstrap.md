# Bootstrap workplace memory

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

## Optional scan of connected sources

After decoding the task list, offer:

```
Want me to scan your messages, email, calendar, and docs to build richer context about the
people, projects, and terms in your work? Takes longer, but the memory is much deeper.
```

If yes, gather from connected tools — chat (Slack), email/calendar (Microsoft 365 /
Google), docs (Notion / Drive), project tracker (Asana / Linear / Jira). Present findings
grouped by confidence: **Ready to add** (offer to add directly), **Needs clarification**
(ask), **Low frequency** (note for later).

## Write memory files

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
