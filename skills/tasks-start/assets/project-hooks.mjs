// Install the generated board commands in one project's native hook settings.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const stat = (file) => fs.lstatSync(file, { throwIfNoEntry: false });

function mergeHooks(settings, generated, host, previous) {
  if (!isObject(settings) || (settings.hooks !== undefined && !isObject(settings.hooks))) return false;
  settings.hooks ??= {};
  for (const [event, [group]] of Object.entries(generated)) {
    const groups = settings.hooks[event] ?? [];
    if (!Array.isArray(groups) || !groups.every((item) => Array.isArray(item?.hooks))) return false;
    const wanted = group.hooks[0].command;
    let found = false;
    const merged = [];
    for (const item of groups) {
      const kept = item.hooks.filter((hook) => {
        const cmd = hook?.command;
        if (typeof cmd !== 'string' || hook.type !== 'command') return true;
        if (!found && cmd === wanted && item.matcher === group.matcher) {
          found = true;
          return true;
        }
        const bridge =
          cmd.includes('board-server.mjs') && cmd.endsWith('-- shaughv-tasks-board-v1 ' + host + ' ' + event);
        const legacy =
          /^node(?:\.exe)?\s+["']?(?:[^"';&|\r\n]*[/\\])?\.tasks[/\\]board-server\.mjs["']?\s+hook\s+(\w+)$/.exec(
            cmd,
          );
        return cmd !== wanted && !previous.has(cmd) && !bridge && legacy?.[1] !== event;
      });
      if (kept.length === item.hooks.length) merged.push(item);
      else if (kept.length) merged.push({ ...item, hooks: kept });
    }
    if (!found) merged.push(group);
    settings.hooks[event] = merged;
  }
  return true;
}

export function installProjectHooks({ project, config, host, generated, git, write }) {
  const local = config.hooks === 'local';
  const targets =
    host === 'codex' ? ['.codex/hooks.json'] : ['.claude/settings.json', '.claude/settings.local.json'];
  const prior = config.hosts?.[host] || {};
  let target = prior.target || (local ? targets.at(-1) : targets[0]);
  const manual = (reason) => ({ host, target, status: 'needs-merge', reason });
  const at = (rel) => path.join(project, rel);
  if (config.hosts !== undefined && !isObject(config.hosts))
    return manual('Review the existing host settings in .tasks/config.json.');
  if (!isObject(prior)) return manual('Review the existing hook record in .tasks/config.json.');
  const dir = path.dirname(targets[0]);
  if (stat(at(dir))?.isSymbolicLink())
    return manual('The settings directory is linked. Use settings inside this repository.');
  if (host === 'codex' && fs.existsSync(at('.codex/config.toml'))) {
    if (stat(at('.codex/config.toml')).isSymbolicLink())
      return manual('The project configuration is linked. Keep hook changes inside this repository.');
    const toml = fs.readFileSync(at('.codex/config.toml'), 'utf8');
    const topLevel = toml.split(/^[ \t]*\[/m, 1)[0];
    if (
      /^[ \t]*\[{1,2}\s*["']?hooks["']?\s*[.\]]/m.test(toml) ||
      /^[ \t]*["']?hooks["']?\s*[.=]/m.test(topLevel)
    ) {
      target = '.codex/config.toml';
      return manual('Merge the board commands into the existing inline hooks.');
    }
  }
  if (!targets.includes(target)) {
    target = local ? targets.at(-1) : targets[0];
    return manual('Review the previously recorded hook location and use settings inside this repository.');
  }
  for (const rel of targets) {
    if (stat(at(rel))?.isSymbolicLink())
      return manual('A settings file is linked. Keep hook changes inside this repository.');
    if (
      rel !== target &&
      fs.existsSync(at(rel)) &&
      /shaughv-tasks-board-v1|board-server\.mjs\\?["']?\s+hook\b/.test(fs.readFileSync(at(rel), 'utf8'))
    ) {
      return manual(
        'Board hooks already exist in ' + rel + '. Reconcile them there before adding another copy.',
      );
    }
  }

  const file = at(target);
  const before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  let settings;
  try {
    settings = before === null ? {} : JSON.parse(before.replace(/^\uFEFF/, ''));
  } catch {
    return manual('The settings file needs a format-preserving edit.');
  }
  const original = JSON.stringify(settings);
  if (!mergeHooks(settings, generated, host, new Set(Object.values(prior.commands || {})))) {
    return manual('Merge the generated commands into the existing hook structure.');
  }
  const changed = original !== JSON.stringify(settings);
  let excludeEntry = prior.excludeEntry;
  if (changed && local && config.git !== 'none') {
    const ignored = git(project, 'check-ignore', '-q', '--', target).status;
    if (ignored !== 0) {
      if (
        ignored !== 1 ||
        before !== null ||
        git(project, 'ls-files', '--error-unmatch', '--', target).status === 0
      )
        return manual('This personal board would change existing shared settings.');
      const prefix = git(project, 'rev-parse', '--show-prefix');
      const exclude = git(project, 'rev-parse', '--path-format=absolute', '--git-path', 'info/exclude');
      if (prefix.status !== 0 || exclude.status !== 0)
        return manual('Git could not locate this repository’s local exclude file.');
      const entry = '/' + (prefix.stdout.trimEnd() + target).replace(/[\\[*?]/g, '\\$&');
      const excludeFile = exclude.stdout.trim();
      const existed = fs.existsSync(excludeFile);
      const existing = existed ? fs.readFileSync(excludeFile, 'utf8') : '';
      if (!existing.split(/\r?\n/).includes(entry)) {
        fs.mkdirSync(path.dirname(excludeFile), { recursive: true });
        const addition = (existing && !existing.endsWith('\n') ? '\n' : '') + entry + '\n';
        fs.appendFileSync(excludeFile, addition);
        if (git(project, 'check-ignore', '-q', '--', target).status !== 0) {
          if (fs.readFileSync(excludeFile, 'utf8') === existing + addition) {
            if (existed) write(excludeFile, existing, stat(excludeFile).mode);
            else fs.unlinkSync(excludeFile);
          }
          return manual('The project’s Git rules would still share these personal hook settings.');
        }
        excludeEntry = entry;
      } else {
        return manual('The project’s Git rules would still share these personal hook settings.');
      }
    }
  }
  if (changed) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (before !== null) {
      const key = createHash('sha256').update(before).digest('hex').slice(0, 16);
      const backup = at('.tasks/secure/' + host + '-' + path.basename(file) + '-' + key + '.bak');
      if (!fs.existsSync(backup)) fs.writeFileSync(backup, before, { flag: 'wx', mode: 0o600 });
    }
    if ((fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null) !== before) {
      return manual('The settings changed during setup. Reread them before retrying.');
    }
    const indent = before?.match(/\r?\n([ \t]+)"/)?.[1] || '  ';
    const newline = before?.includes('\r\n') ? '\r\n' : '\n';
    const bom = before?.startsWith('\uFEFF') ? '\uFEFF' : '';
    write(
      file,
      bom + JSON.stringify(settings, null, indent).replaceAll('\n', newline) + newline,
      stat(file)?.mode ?? 0o600,
    );
  }
  const actual = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  const commands = Object.values(generated).map(([group]) => group.hooks[0].command);
  for (const [event, [group]] of Object.entries(generated)) {
    const installed = actual.hooks?.[event]
      ?.filter((item) => item.matcher === group.matcher)
      .flatMap((item) => item.hooks)
      .filter((item) => item?.type === 'command' && item.command === group.hooks[0].command);
    if (installed?.length !== 1) return manual('Could not verify the installed command for ' + event + '.');
  }
  const pendingReview = host === 'codex' && (changed || prior.pendingReview !== false);
  config.hosts ??= {};
  config.hosts[host] = {
    ...prior,
    hooks: 'enabled',
    target,
    commands,
    pendingReview,
    ...(excludeEntry ? { excludeEntry } : {}),
  };
  return { host, target, status: 'configured', changed, pendingReview };
}
