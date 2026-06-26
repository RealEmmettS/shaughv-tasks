---
name: tasks-memory
description: >
  Two-tier workplace-memory model that lets Claude decode Emmett's shorthand, acronyms,
  nicknames, project codenames, and internal language like a colleague would. Reference this
  whenever working with the tasks-* system's memory: deciding what goes in working memory vs
  deep memory, adding "remember that X means Y", recalling "who is X / what does X mean", or
  decoding a request full of internal terms. Working memory lives in `.tasks/CLAUDE.md`; deep
  memory in `.tasks/memory/`. Set up by /tasks-start, refreshed by /tasks-update, and
  promoted into the repo by /tasks-remove.
user-invocable: false
---

# Workplace Memory

Memory makes Claude a colleague who speaks the user's internal language instead of asking
round-trip clarifying questions.

```
User: "ask todd to do the PSR for oracle"
              ↓ Claude decodes
"Ask Todd Martinez (Finance lead) to prepare the Pipeline Status Report for the Oracle
 Systems deal ($2.3M, closing Q2)"
```

## Architecture (two tiers, inside `.tasks/`)

```
.tasks/CLAUDE.md      ← hot cache (~30 people, common terms, active projects, preferences)
.tasks/memory/
  glossary.md         ← full decoder ring (everyone, every term)
  people/             ← complete profiles
  projects/           ← project details
  context/            ← company, teams, tools, processes
```

**`.tasks/CLAUDE.md` (hot cache)** — top ~30 people, ~30 most common terms, active projects
(5–15), preferences. Goal: cover 90% of daily decoding. Keep it ~50–100 lines.

**`.tasks/memory/glossary.md`** — the complete decoder ring; searched when something isn't
in the hot cache; can grow indefinitely.

**`.tasks/memory/people|projects|context/`** — rich detail for execution.

> This memory is the task system's **private** store. It is separate from any repo-root
> `CLAUDE.md`. `/tasks-remove` is what promotes it into the repo's real `CLAUDE.md` and
> `memory/` when the user is ready.

## Lookup flow (always decode before acting)

```
1. .tasks/CLAUDE.md          → check first, covers ~90%
2. .tasks/memory/glossary.md → full glossary if not in hot cache
3. .tasks/memory/people|projects/ → rich detail when needed for execution
4. Ask the user              → unknown term? learn it, then write it down.
```

## Working memory format (`.tasks/CLAUDE.md`)

Use tables for compactness. Target ~50–80 lines.

```markdown
# Memory

## Me
[Name], [Role] on [Team]. [One sentence about what I do.]

## People
| Who | Role |
|-----|------|
| **Todd** | Todd Martinez, Finance lead |
| **Sarah** | Sarah Chen, Engineering (Platform) |
→ Full list: memory/glossary.md, profiles: memory/people/

## Terms
| Term | Meaning |
|------|---------|
| PSR | Pipeline Status Report |
| P0 | Drop-everything priority |
→ Full glossary: memory/glossary.md

## Projects
| Name | What |
|------|------|
| **Phoenix** | DB migration, Q2 launch |
→ Details: memory/projects/

## Preferences
- Async-first, Slack over email
- No meetings Friday afternoons
```

## Deep memory formats (`.tasks/memory/`)

**glossary.md** — Acronyms, Internal Terms, Nicknames → Full Names, Project Codenames
(tables for each).

**people/{name}.md** — `**Also known as:**`, role, team, communication style, context,
notes.

**projects/{name}.md** — codename, status, what it is, key people, context.

**context/company.md** — tools & systems, teams, processes.

## Adding memory

When the user says "remember this" or "X means Y":

1. **Glossary items** → `memory/glossary.md`; if frequent, also promote to `.tasks/CLAUDE.md`.
2. **People** → create/update `memory/people/{name}.md`; capture **nicknames**.
3. **Projects** → create/update `memory/projects/{name}.md`; capture **codenames**.
4. **Preferences** → `.tasks/CLAUDE.md` Preferences.

## What goes where

| Type | `.tasks/CLAUDE.md` (hot) | `.tasks/memory/` (full) |
|------|--------------------------|--------------------------|
| Person | top ~30 contacts | glossary + people/{name}.md |
| Acronym/term | ~30 most common | glossary (complete) |
| Project | active only | glossary + projects/{name}.md |
| Nickname | if person is top-30 | glossary (all) |
| Company context | quick ref | context/company.md |
| Historical/stale | remove | keep |

## Promotion / demotion

- **Promote to hot cache** when a term/person becomes frequent or part of active work.
- **Demote to `memory/` only** when a project completes, a contact goes quiet, or a term
  falls out of use. This keeps the hot cache lean and current.

## Conventions

- Filenames lowercase kebab-case (`todd-martinez.md`, `project-phoenix.md`).
- Always capture nicknames and alternate names — they're what decoding hinges on.
- **Bold** terms in the hot cache for scannability.
