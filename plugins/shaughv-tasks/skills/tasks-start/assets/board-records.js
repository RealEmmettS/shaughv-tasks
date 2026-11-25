// Shared by the direct-file dashboard and the Node agent client.
(() => {
  function sections(markdown) {
    const result = [];
    let fence = '';
    for (const match of markdown.matchAll(/^([^\r\n]+)\r?$/gm)) {
      const line = match[1];
      const delimiter = line.match(/^\s*(`{3,}|~{3,})/);
      if (delimiter) {
        if (!fence) fence = delimiter[1];
        else if (delimiter[1][0] === fence[0] && delimiter[1].length >= fence.length) fence = '';
        continue;
      }
      const heading = !fence && line.match(/^##\s+(.+?)\s*$/);
      if (heading) {
        if (result.length) result.at(-1).end = match.index;
        result.push({ name: heading[1], start: match.index, end: markdown.length });
      }
    }
    return result;
  }

  function append(markdown, kind, message, author) {
    const heading = { comment: 'Comments', result: 'Results', criterion: 'Verification' }[kind];
    if (!heading || !message.trim()) throw Error('Enter a message.');
    const line = message.trim().replace(/\s+/g, ' ');
    const by = String(author || '')
      .trim()
      .replace(/\s+/g, ' ');
    if (kind !== 'criterion' && !by) throw Error('Supply the human or agent name.');
    const entry =
      kind === 'criterion' ? '- [ ] ' + line : '- ' + new Date().toISOString() + ' — ' + by + ' — ' + line;
    const nl = markdown.includes('\r\n') ? '\r\n' : '\n';
    const block = sections(markdown).find((s) => s.name.toLowerCase() === heading.toLowerCase());
    const end = block?.end ?? markdown.length;
    const prefix = markdown.slice(0, end).replace(/(?:\r?\n)+$/, '');
    const tail = markdown.slice(end);
    return (
      prefix +
      (block ? nl : (prefix ? nl + nl : '') + '## ' + heading + nl) +
      entry +
      nl +
      (tail ? nl + tail : '')
    );
  }

  globalThis.ShaughvTaskRecords = Object.freeze({ sections, append });
})();
