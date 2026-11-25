# SHAUGHV Tasks

See who owns each task, what your coding agents are building, and what’s ready for your review. Open a card in your browser to read the result, ask for a change, or mark it complete. You and your agents can both edit the board.

[Open your board](#open-your-board) · [Try a first task](#take-a-task-through-review) · [Install with npx](#install-with-npx) · [Downloads](#downloads-and-other-installs)

## Open your board

Open **the project you want to manage** in Codex, Claude Code, or another local coding tool that can edit files and run commands. Copy this whole message into that project’s chat.

```text
Use this guide to set up SHAUGHV Tasks in the repo open in this chat.
https://github.com/RealEmmettS/shaughv-tasks/blob/main/AGENT-QUICKSTART.md
Install the skills here and set up the board hooks this tool supports.
Start or reopen the board and give me its link.
Read the tasks and tell me what needs attention first.
```

Open the link your agent gives you. In Codex, use `/hooks` to review and trust the project hooks. These let your coding tool pick up the board when a session starts. Next time, just ask **“Open my task board.”**

## Take a task through review

![Example project board. Emmett owns the launch checklist, Codex is refining the review queue, and the project brief is ready for review.](docs/images/task-board.jpg)

1. **Describe the work.** Choose **New task** and enter “Add a Help link to the mobile menu.” Open the card, set an **Owner**, and add a check under **Success criteria** such as “Help opens the support page on my phone.”
2. **See what changed.** The owner can use **Post result** to record what they tested and move the card into **Review**. Open the card and try the link on your phone.
3. **Make the call.** If the link works, check off the criterion and choose **Mark complete**. If it needs another pass, leave a **Comment** and move the card back to **Active**.

Group related tasks with **New milestone**. Use **Memory** for project decisions you want to keep across chats.

**Starting a new chat?** Use **Agent brief** for a summary of the whole board, or **Copy handoff** inside one card for that task and its notes.

### Where your work lives

Tasks, comments, results, and project notes are Markdown files in your project’s `.tasks/` folder. Edits show up live on the same local board. To share across computers, commit and sync the files with Git. For a personal board, ask your agent to keep it out of Git during setup.

## Install with npx

If you prefer to install the skills yourself, open a terminal in your project folder. Use Node.js 22.20 or later. [Get Node.js](https://nodejs.org/en/download)

```sh
npx skills add RealEmmettS/shaughv-tasks --skill "*"
```

Choose the coding tools you use and the project install when prompted. Then paste the [setup message](#open-your-board) into your project chat to start the board and set up its hooks.

<details>
<summary>Install for several coding tools at once</summary>

**For Codex and Claude Code in this project**

```sh
npx --yes skills add RealEmmettS/shaughv-tasks --skill "*" --agent codex claude-code -y
```

**For every supported coding tool in this project**

```sh
npx --yes skills add RealEmmettS/shaughv-tasks --all
```

Add `-g` if you want the skills available across all your projects. Each board and its hooks still belong to the project where you run setup.

</details>

## Downloads and other installs

- **Complete kit.** Get all seven skills, the board, and the guides in one download. [Download the ZIP](https://github.com/RealEmmettS/shaughv-tasks/releases/latest/download/shaughv-tasks.zip)
- **Individual skills.** For tools that accept `.skill` uploads, choose the ones you need. [Download tasks-start.skill](https://github.com/RealEmmettS/shaughv-tasks/releases/latest/download/tasks-start.skill) · [Browse all seven](https://github.com/RealEmmettS/shaughv-tasks/releases/latest)

<details>
<summary>Install the ZIP or start its board directly</summary>

Extract the ZIP. To install the skills by hand, copy the seven folders inside `skills/` into your project's `.agents/skills/` for Codex or `.claude/skills/` for Claude Code. Then paste the setup message into that project's chat.

To start the board directly, open a terminal in the extracted folder and replace the example path below with your project's folder.

```sh
node skills/tasks-start/assets/setup.mjs --project "/path/to/your/project"
```

Open the local address shown under `url`. For project hooks, add `--hooks codex` or `--hooks claude` for the tool you use.

</details>

<details>
<summary>Install from the Codex or Claude Code marketplace</summary>

**Codex** · Run in a terminal.

```sh
codex plugin marketplace add RealEmmettS/shaughv-tasks
codex plugin add shaughv-tasks@shaughv-tasks
```

**Claude Code** · Run these commands one at a time in its chat.

```text
/plugin marketplace add RealEmmettS/shaughv-tasks
/plugin install shaughv-tasks@shaughv-tasks
```

Open your project chat and ask “Use the installed SHAUGHV Tasks plugin to open this repo’s board and set up its project hooks.”

</details>

## Updates

Use the method you originally installed with. Then ask your agent to open the board in each project to apply the update.

<details>
<summary>Find my update command</summary>

- **npx** · Run `npx skills update` in the project, or `npx skills update -g` for a user-wide install.
- **Codex marketplace** · Run `codex plugin marketplace upgrade shaughv-tasks`, then `codex plugin add shaughv-tasks@shaughv-tasks`.
- **Claude Code marketplace** · In a terminal, run `claude plugin marketplace update shaughv-tasks`, then `claude plugin update shaughv-tasks@shaughv-tasks`.
- **Manual download** · Replace the installed skill folders with the copies from the latest ZIP.

</details>

[What’s new](HUMAN_CHANGELOG.md) · [Agent setup guide](https://github.com/RealEmmettS/shaughv-tasks/blob/main/AGENT-QUICKSTART.md) · [Working from a chat snapshot](skills/tasks-management/references/chatgpt.md)
