import fs from 'node:fs';
import { randomBytes } from 'node:crypto';
import './board-records.js';

const usage = [
  'node .tasks/board-server.mjs agent <action>',
  'read board | milestones | task ID | milestone ID | memory PATH | memory-tree',
  'delete milestone ID --revision HASH (detail record only)',
  'write <same document> --revision HASH < edited.md',
  'write board --revision HASH --complete ID --detail-revision HASH < edited.md',
  'write board --revision HASH --delete ID < edited.md',
  'create --title TITLE [--to SECTION] [--by NAME]',
  'claim ID --by NAME | move ID --to SECTION | complete ID | reopen ID',
  'comment ID --by NAME --text MESSAGE',
  'result ID --by NAME --text MESSAGE',
  'criterion ID --text MESSAGE',
  'Use --file PATH instead of stdin for write, or for the text of a new entry.',
].join('\n');

export async function agent(args, connect) {
  const [action, resource, ...rest] = args;
  if (!action || action === 'help' || action === '--help') return { usage };
  const boardAction = ['claim', 'create', 'move', 'complete', 'reopen'].includes(action);
  if (action === 'create' && resource) rest.unshift(resource);
  const quick = boardAction || ['comment', 'result', 'criterion'].includes(action);
  if (action === 'delete' && resource !== 'milestone') throw Error(usage);
  if (!quick && !['read', 'write', 'delete'].includes(action)) throw Error(usage);
  const kind = quick ? (boardAction ? 'board' : 'task') : resource;
  let id = quick ? resource : ['task', 'milestone', 'memory'].includes(kind) ? rest.shift() : '';
  if (((quick && action !== 'create') || ['task', 'milestone'].includes(kind)) && !/^[a-z0-9]{2,8}$/.test(id))
    throw Error('Supply a task or milestone ID.');
  const endpoints = {
    board: '/api/tasks',
    milestones: '/api/milestones',
    'memory-tree': '/api/memory/tree',
    task: '/api/task?id=',
    milestone: '/api/milestone?id=',
    memory: '/api/memory/file?path=',
  };
  if (!Object.hasOwn(endpoints, kind) || (kind === 'memory-tree' && action !== 'read')) throw Error(usage);
  const allowed =
    action === 'delete'
      ? ['--revision']
      : action === 'write'
        ? ['--revision', '--file', ...(kind === 'board' ? ['--complete', '--detail-revision', '--delete'] : [])]
        : boardAction
          ? { claim: ['--by'], create: ['--by', '--title', '--to'], move: ['--to'], complete: [], reopen: [] }[
              action
            ]
          : quick
            ? ['--by', '--text', '--file']
            : [];
  const options = {};
  for (let i = 0; i < rest.length; i += 2) {
    if (!allowed.includes(rest[i]) || !rest[i + 1] || rest[i] in options) throw Error(usage);
    options[rest[i]] = rest[i + 1];
  }
  if (['write', 'delete'].includes(action) && !/^[a-f0-9]{64}$/.test(options['--revision'] || ''))
    throw Error('Read the document first and supply its revision.');
  const { url, boardId } = await connect();
  const address = new URL(
    endpoints[kind] + (['task', 'milestone', 'memory'].includes(kind) ? encodeURIComponent(id) : ''),
    url,
  );
  const request = async (options = {}, endpoint = address) => {
    const res = await fetch(endpoint, {
      ...options,
      redirect: 'error',
      headers: { 'X-Expected-Board-Id': boardId, ...options.headers },
    });
    if (res.headers.get('X-Board-Id') !== boardId) throw Error('The port is serving a different board.');
    if (res.status === 409 || res.status === 412)
      throw Error('Conflict. Re-read the current record and reconcile your edit.');
    if (!res.ok) throw Error('Board returned ' + res.status + ': ' + (await res.text()).slice(0, 400));
    return res;
  };
  const board = kind === 'board' || kind === 'milestones';
  const header = board ? 'X-Board-Revision' : 'X-Detail-Revision';
  let revision = options['--revision'];
  if (action === 'delete') {
    await request({ method: 'DELETE', headers: { 'X-Base-Revision': revision } });
    return { ok: true, resource: kind, id };
  }
  let markdown;
  if (action !== 'write') {
    const res = await request();
    if (kind === 'memory-tree') return res.json();
    markdown = await res.text();
    revision = res.headers.get(header);
    if (!revision) throw Error('Upgrade the board to enable revision-checked edits.');
    if (action === 'read') return { boardId, resource: kind, id, revision, markdown };
  }
  if (action === 'claim') {
    const owner = options['--by']?.trim();
    if (!owner || /[()\r\n]/.test(owner)) throw Error('Supply a single-line owner name.');
    const row = new RegExp('^- \\[ \\][^\\r\\n]*#' + id + '[ \\t]*(?=\\r?$)', 'gm');
    const matches = [...markdown.matchAll(row)];
    if (matches.length !== 1) throw Error('Expected one open task with this ID.');
    const current = matches[0][0].match(/\(owner\s+([^)]+)\)/i);
    if (current && current[1] !== owner) throw Error('Already assigned to ' + current[1] + '.');
    if (current) return { ok: true, id, owner, revision };
    markdown = markdown.replace(row, (line) =>
      line.replace(/#[a-z0-9]+\s*$/, () => '(owner ' + owner + ') #' + id),
    );
  } else if (boardAction) {
    const nl = markdown.includes('\r\n') ? '\r\n' : '\n';
    const lines = markdown.split(/\r?\n/);
    const headings = () =>
      lines
        .map((line, i) => ({ name: line.match(/^##\s+\*{0,2}(.+?)\*{0,2}\s*$/)?.[1], i }))
        .filter((h) => h.name);
    const stages = headings();
    const destination =
      options['--to'] ||
      (action === 'complete'
        ? stages.find((h) => /^(completed|done)$/i.test(h.name))?.name
        : stages.find((h) => /^to-do$/i.test(h.name))?.name ||
          stages.find((h) => !/^(completed|done)$/i.test(h.name))?.name);
    const target = stages.find((h) => h.name.toLowerCase() === destination?.toLowerCase());
    if (!target) throw Error('Choose an existing destination column.');
    const done = /^(completed|done)$/i.test(target.name);
    if (done && action !== 'complete') throw Error('Use complete to move a task into Completed.');
    let block;
    if (action === 'create') {
      const title = options['--title']?.trim(),
        owner = options['--by']?.trim();
      if (!title || /[\r\n]|\*\*/.test(title) || /[\r\n()]/.test(owner || ''))
        throw Error('Supply a single-line title and owner.');
      const milestones = await (await request({}, new URL('/api/milestones', url))).text();
      do {
        id = randomBytes(3).toString('hex');
      } while ((markdown + milestones).includes('#' + id));
      block = ['- [ ] **' + title + '**' + (owner ? ' (owner ' + owner + ')' : '') + ' #' + id];
    } else {
      const at = lines.findIndex((line) => /^- \[[ xX]\]/.test(line) && line.trimEnd().endsWith('#' + id));
      if (at < 0) throw Error('Task not found.');
      const checked = /^- \[[xX]\]/.test(lines[at]);
      if (checked !== (action === 'reopen'))
        throw Error(checked ? 'Reopen this task before moving it.' : 'Task is already open.');
      let end = at + 1;
      for (let cursor = end; cursor < lines.length; cursor++) {
        if (!lines[cursor].trim()) continue;
        if (!/^[ \t]+\S/.test(lines[cursor])) break;
        end = cursor + 1;
      }
      block = lines.splice(at, end - at);
      if (action === 'complete') {
        const detail = await request({}, new URL('/api/task?id=' + id, url));
        options['--complete'] = id;
        options['--detail-revision'] = detail.headers.get('X-Detail-Revision');
        block[0] = block[0].replace('- [ ]', '- [x]');
      }
      if (action === 'reopen')
        block[0] = block[0].replace(/^- \[[xX]\]/, '- [ ]').replace(/ \(done \d{4}-\d{2}-\d{2}\)/, '');
    }
    const column = headings().find((h) => h.name === target.name);
    lines.splice(column.i + 1, 0, ...block);
    markdown = lines.join(nl);
  } else if (quick) {
    const message = options['--file'] ? fs.readFileSync(options['--file'], 'utf8') : options['--text'] || '';
    markdown = globalThis.ShaughvTaskRecords.append(markdown, action, message, options['--by']);
  } else {
    if (!options['--file'] && process.stdin.isTTY) throw Error('Supply Markdown on stdin or use --file PATH.');
    markdown = fs.readFileSync(options['--file'] || 0, 'utf8');
  }
  const headers = {
    'Content-Type': 'text/markdown',
    [board && kind === 'board' ? 'X-Base-Board-Revision' : 'X-Base-Revision']: revision,
  };
  if (options['--complete']) {
    headers['X-Completion-Task-Id'] = options['--complete'];
    headers['X-Completion-Detail-Revision'] = options['--detail-revision'] || '';
  }
  if (options['--delete']) headers['X-Delete-Task-Id'] = options['--delete'];
  const res = await request({ method: 'POST', headers, body: markdown });
  return { ok: true, resource: kind, id, revision: res.headers.get(header) };
}
