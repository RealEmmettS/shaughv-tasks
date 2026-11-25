#!/usr/bin/env node
// Run from the loaded skill or extracted release, with the target project as cwd.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const assets = path.dirname(fileURLToPath(import.meta.url));
const files = [
  'dashboard.html',
  'dashboard.css',
  'board-server.mjs',
  'board-hooks.mjs',
  'board-agent.mjs',
  'board-records.js',
];
const { values } = parseArgs({
  options: {
    project: { type: 'string' },
    title: { type: 'string' },
    local: { type: 'boolean' },
    tracked: { type: 'boolean' },
    repair: { type: 'boolean' },
    help: { type: 'boolean' },
  },
});
if (values.help) {
  console.log('node setup.mjs [--project PATH] [--title NAME] [--local | --tracked] [--repair]');
  process.exit(0);
}
function optional(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') return '';
    throw e;
  }
}
function json(file) {
  return JSON.parse(optional(file) || '{}');
}
function write(file, data) {
  if (fs.existsSync(file) && fs.readFileSync(file).equals(Buffer.from(data))) return;
  const tmp = file + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, data);
  try {
    fs.renameSync(tmp, file);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}
function seed(file, data) {
  try {
    fs.writeFileSync(file, data, { flag: 'wx' });
  } catch (e) {
    if (e.code !== 'EEXIST') throw e;
  }
}
function git(dir, ...args) {
  return spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8', windowsHide: true });
}
function versionOrder(a, b) {
  for (let i = 0; i < 3; i++) {
    const diff = Number(a.split('.')[i]) - Number(b.split('.')[i]);
    if (diff) return diff;
  }
  return 0;
}
async function setup() {
  if (values.local && values.tracked) throw Error('Choose either --local or --tracked.');
  const start = fs.realpathSync(values.project || '.');
  const repo = git(start, 'rev-parse', '--show-toplevel');
  const boundary = repo.status === 0 ? fs.realpathSync(repo.stdout.trim()) : start;
  let project = start;
  while (!fs.existsSync(path.join(project, '.tasks')) && project !== boundary) project = path.dirname(project);
  const board = path.join(project, '.tasks');
  const sourceVersion = json(path.join(assets, 'board-version.json')).pluginVersion;
  const lock = net.createServer();
  const key = crypto
    .createHash('sha256')
    .update(process.platform === 'win32' ? board.toLowerCase() : board)
    .digest('hex')
    .slice(0, 24);
  const socket =
    process.platform === 'linux' && Number(process.versions.node.split('.')[0]) >= 22
      ? '\0shaughv-setup-' + key
      : process.platform === 'win32'
        ? '\\\\.\\pipe\\shaughv-setup-' + key
        : path.join(os.tmpdir(), 'shaughv-setup-' + key + '.sock');
  await new Promise((resolve, reject) => {
    lock.once('error', reject);
    lock.listen(socket, resolve);
  });
  try {
    fs.mkdirSync(board, { recursive: true });
    const at = (name) => path.join(board, name);
    const config = json(at('config.json'));
    const stored = [
      json(at('.board-version.json')).pluginVersion,
      config.pluginVersion,
      json(at('.install-manifest.json')).pluginVersion,
    ].find((v) => typeof v === 'string' && /^\d+\.\d+\.\d+$/.test(v));
    if (stored && versionOrder(stored, sourceVersion) > 0)
      throw Error('This board uses ' + stored + '. Update the installed skills before running setup.');
    const server = (...args) =>
      execFileSync(process.execPath, [at('board-server.mjs'), ...args], {
        cwd: project,
        encoding: 'utf8',
        windowsHide: true,
        env: { ...process.env, SHAUGHV_TASKS_ASSETS_DIR: assets },
      }).trim();
    const marker = at('.board-version.json');
    const upgrading = !stored || versionOrder(stored, sourceVersion) < 0;
    // A damaged bundle may be missing an imported module. Restore missing runtime files before probing it.
    const bundled = new Map(files.map((file) => [file, fs.readFileSync(path.join(assets, file))]));
    for (const [file, data] of bundled) if (!fs.existsSync(at(file))) write(at(file), data);
    const running = JSON.parse(server('status')).port;
    const restart = running && upgrading;
    const insideGit = repo.status === 0;
    const trackedFiles = insideGit && git(project, 'ls-files', '--', '.tasks').stdout.trim();
    const ignored = insideGit && git(project, 'check-ignore', '-q', '--', '.tasks/TASKS.md').status === 0;
    const tracking =
      config.git ||
      (!insideGit ? 'none' : trackedFiles ? 'tracked' : ignored || values.local ? 'ignored' : 'tracked');
    if ((values.tracked && tracking !== 'tracked') || (values.local && tracking === 'tracked')) {
      throw Error(
        'Existing Git tracking differs from the requested setting. Preserve it or change it explicitly in the project.',
      );
    }
    const generic = /^(tasks|task board|shaughv tasks)$/i;
    const title =
      [
        config.boardTitle,
        values.title,
        optional(path.join(project, 'README.md')).match(/^#\s+(.+)/m)?.[1],
        jsonIfValid(path.join(project, 'package.json')).name,
        path.basename(project).replace(/[-_]+/g, ' '),
      ].find((v) => typeof v === 'string' && v.trim() && !generic.test(v.trim())) ||
      path.basename(project) + ' workspace';
    const ignoreLines = [
      'secure/',
      '.task-detail-tombstones/',
      '.board-server.json',
      '.board-nudge.json',
      '.board-server.log',
      'vendor/',
      'node_modules/',
      'package.json',
      'package-lock.json',
      '.package-lock.json',
      '.install-manifest.json',
      '*.tmp',
    ];
    const appendLines = (file, lines) => {
      const before = optional(file),
        present = new Set(before.split(/\r?\n/));
      const missing = lines.filter((line) => !present.has(line));
      if (missing.length)
        fs.appendFileSync(file, (before && !before.endsWith('\n') ? '\n' : '') + missing.join('\n') + '\n');
    };
    appendLines(at('.gitignore'), ignoreLines);
    if (tracking === 'ignored' && !ignored) appendLines(path.join(project, '.gitignore'), ['.tasks/']);
    for (const dir of ['tasks', 'milestones', 'secure', 'memory/people', 'memory/projects', 'memory/context'])
      fs.mkdirSync(at(dir), { recursive: true });
    for (const dir of ['people', 'projects', 'context']) seed(at('memory/' + dir + '/.gitkeep'), '');
    seed(at('TASKS.md'), '# Tasks\n\n## Backlog\n\n## To-Do\n\n## Active\n\n## Review\n\n## Completed\n');
    seed(at('MILESTONES.md'), '# Milestones\n');
    seed(
      at('CLAUDE.md'),
      '<!-- tasks-bootstrap: pending -->\n> Secrets belong in the OS keychain, environment, or ignored secure/ folder.\n\n# Workplace memory\n\n## Me\n\n## People\n\n| Name | Role |\n| --- | --- |\n\n## Terms\n\n| Term | Meaning |\n| --- | --- |\n\n## Projects\n\n| Project | Context |\n| --- | --- |\n\n## Preferences\n',
    );
    seed(at('memory/glossary.md'), '# Glossary\n\n## Terms\n\n## People\n\n## Projects\n');
    seed(
      at('secure/README.md'),
      '# Private local material\n\nThis directory is ignored by Git and excluded from the board.\n',
    );
    if (upgrading) for (const [file, data] of bundled) write(at(file), data);
    write(
      at('board-config.js'),
      'window.SHAUGHV_TASKS_BOARD = ' + JSON.stringify({ boardTitle: title }) + ';\n',
    );
    const install = JSON.parse(server('install', '--offline', '--no-global', '--json'));
    if (!install.ok || !install.total || install.provisioned !== install.total)
      throw Error('Incomplete board assets. Restore the full skill bundle and rerun setup.');
    Object.assign(config, {
      schemaVersion: config.schemaVersion || 1,
      git: tracking,
      hooks: config.hooks || (tracking === 'tracked' ? 'shared' : 'local'),
      boardTitle: title,
      createdAt: config.createdAt || new Date().toISOString().slice(0, 10),
      pluginVersion: sourceVersion,
    });
    write(at('config.json'), JSON.stringify(config, null, 2) + '\n');
    const instruction =
      '\n## Task management system\n\nWork from .tasks/TASKS.md, .tasks/MILESTONES.md and .tasks/CLAUDE.md. Read the active task in .tasks/tasks/<id>.md. Humans and agents share the board, review queue, comments, results and success criteria. Run \x60node .tasks/board-server.mjs agent help\x60 for revision-checked edits. Setup and operating guide: https://github.com/RealEmmettS/shaughv-tasks/blob/main/AGENT-QUICKSTART.md\n';
    for (const name of [
      fs.existsSync(path.join(project, 'AGENTS.override.md')) ? 'AGENTS.override.md' : 'AGENTS.md',
      'CLAUDE.md',
    ]) {
      const file = path.join(project, name);
      const previous = optional(file);
      if (!/^## Task management system\s*$/im.test(previous))
        fs.appendFileSync(file, (previous ? '\n' : '') + instruction.trimStart());
      else if (!previous.includes('shaughv-tasks/blob/main/AGENT-QUICKSTART.md')) {
        const heading = /^(## Task management system[^\S\r\n]*\r?$)/im;
        write(
          file,
          previous.replace(
            heading,
            '$1\n\n[Agent setup and operations](https://github.com/RealEmmettS/shaughv-tasks/blob/main/AGENT-QUICKSTART.md)',
          ),
        );
      }
    }
    write(marker, fs.readFileSync(path.join(assets, 'board-version.json')));
    if (restart) server('stop');
    let url = null;
    if (!values.repair || running) {
      url = server('ensure');
      const identity = await (await fetch(new URL('/api/ping', url), { redirect: 'error' })).json();
      if (identity.ok !== 'shaughv-task-board' || fs.realpathSync(identity.root) !== fs.realpathSync(board))
        throw Error('Board identity check failed.');
    }
    return { project, board, title, version: sourceVersion, tracking, assets: install.provisioned, url };
  } finally {
    lock.close();
  }
}
function jsonIfValid(file) {
  try {
    return json(file);
  } catch {
    return {};
  }
}
try {
  console.log(JSON.stringify(await setup()));
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
