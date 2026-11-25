# Set up SHAUGHV Tasks in the open project

Use the repository attached to the chat where the human pasted the setup message. In a terminal there, `git rev-parse --show-toplevel` prints its root. Change to that folder before running the commands below. If several repositories are open and the target is unclear, ask which one to use.

## Set up or resume

The README’s setup message asks for a project install and the current tool’s project hooks. The commands below install all seven skills in that repository, start or resume its `.tasks/` board, and configure hooks for the selected tool. The npx installer needs Node.js 22.20 or later.

### Codex

```sh
npx --yes skills add RealEmmettS/shaughv-tasks --skill "*" --agent codex -y
node .agents/skills/tasks-start/assets/setup.mjs --hooks codex
```

### Claude Code

```sh
npx --yes skills add RealEmmettS/shaughv-tasks --skill "*" --agent claude-code -y
node .claude/skills/tasks-start/assets/setup.mjs --hooks claude
```

### Other setups

- **Already installed.** Use `assets/setup.mjs` beside the loaded `tasks-start/SKILL.md`. Run it from the target repository with the same hook flag for the current tool. If `--help` does not list `--hooks`, update the skills or use the current project install above.
- **Another coding tool.** Install the skills for that tool and run its `tasks-start/assets/setup.mjs` from the project. The board supports file and terminal access. Native hooks are available for Codex and Claude Code. [Project install options](README.md#install-with-npx)
- **Manual download.** Extract the [complete ZIP](https://github.com/RealEmmettS/shaughv-tasks/releases/latest/download/shaughv-tasks.zip) outside the target repository. From the project, run `node "/path/to/extracted/skills/tasks-start/assets/setup.mjs"` with the hook flag for your tool.
- **Personal board.** For a new Git project, add `--local` to the setup command if the human wants the board kept out of Git. Existing boards retain their tracking settings. Use `--repair` to upgrade without starting a stopped board.

### Open the board and pick up work

1. Check the setup output. `project` must be the selected repository and `board` its `.tasks/` folder. Open the verified `url` and give the human the link.
2. Check `hooks` when you requested them. `configured` means the commands were written and verified in the project settings. In Codex, tell the human to review the project hooks in `/hooks` when `pendingReview` is true. If setup reports `needs-merge`, finish the merge in the indicated project settings and verify the installed commands. The host guide covers inline TOML, existing local settings, and native review. [Hook setup and verification](skills/tasks-start/references/hosts.md#optional-native-hooks)
3. Read the effective root instructions, `.tasks/CLAUDE.md`, the board, milestones, and relevant task records. Summarize what is active, blocked, or ready for review. On an empty board, invite the human to name the first task.

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
