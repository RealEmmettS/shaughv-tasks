# Start here with a project

Give a human or agent this permanent link: https://github.com/RealEmmettS/shaughv-tasks/blob/main/AGENT-QUICKSTART.md

Work in the project the user is building. This repository distributes the tools. The target project's own `.tasks/` holds the data.

## Set up or resume

1. When the skills are already installed, locate the loaded `tasks-start/SKILL.md`. The setup helper is beside it under `assets/setup.mjs`.
2. Otherwise use the [README install instructions](README.md#install-with-npx) for the requested agent and scope. For a manual install, extract the [complete release](https://github.com/RealEmmettS/shaughv-tasks/releases/latest/download/shaughv-tasks.zip) outside the target project. The same helper lives in `skills/tasks-start/assets/`.
3. Run `node "/path/to/tasks-start/assets/setup.mjs" --project "/path/to/project"`. It finds an existing board within the repository boundary, repairs the portable bundle, provisions the shipped fonts and scripts, and returns JSON with the verified board URL. Open that URL for the human. On an existing board retain its tracking choice. On a new Git project, use `--local` if the operator wants personal tracking. Use `--repair` to upgrade without starting a stopped board.
4. Read the project's effective root instructions, then `.tasks/CLAUDE.md`, `.tasks/TASKS.md`, `.tasks/MILESTONES.md`, and the relevant task records. Report what is active, blocked, or awaiting review. Hooks and memory interviews are optional. [Host setup](skills/tasks-start/references/hosts.md)

## Operate the board

The GUI and agent client use one local server and the same Markdown. From the target project:

```sh
node .tasks/board-server.mjs agent read board
node .tasks/board-server.mjs agent create --title "Check project navigation" --to To-Do --by Codex
```

Use the returned ID in the remaining commands. A claim refuses to replace another owner. Use a revision-checked board edit for an intentional reassignment.

```sh
node .tasks/board-server.mjs agent move abc --to Active
node .tasks/board-server.mjs agent criterion abc --text "The menu works with a keyboard"
node .tasks/board-server.mjs agent comment abc --by Emmett --text "Include the mobile menu."
node .tasks/board-server.mjs agent result abc --by Codex --text "Verified the open and close shortcuts in Chrome."
node .tasks/board-server.mjs agent move abc --to Review
node .tasks/board-server.mjs agent read task abc
```

Record the evidence and update the matching Markdown check. Either operator can finish with `agent complete abc` or **Mark complete** when prerequisites, subtasks, and success criteria pass. **Review** is an open column available to humans and agents. [Full command reference](skills/tasks-start/references/agents.md)

## Resume and recover

- **Stale edit** — read the latest revision, merge the intended change, then submit again. Keep unrelated edits and unknown record sections.
- **Another project is open** — use the URL returned by this project's helper or run `node .tasks/board-server.mjs ensure` here. Each board has its own root and identity.
- **Shared checkout** — synchronize Markdown through your normal Git workflow. Run setup in each checkout to provision its local assets.
- **Chat-only agent** — use the GUI's **Agent brief** or a task's **Copy handoff**. Return proposed Markdown and checks to the project operator. [Snapshot workflow](skills/tasks-management/references/chatgpt.md)
- **Manual recovery or no Node** — follow the [setup reference](skills/tasks-start/references/setup.md). The static dashboard can edit selected local files in a browser supporting file handles.
