import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
const pages = JSON.parse(await readFile('docs/wiki-data.json', 'utf8'));
await mkdir('wiki', { recursive: true }); await mkdir('dist/docs', { recursive: true });
const markdown = page => {
  const lines = ['# ' + page.title, '', '> InoQuill v1.0.0 by TabGrinder', '', page.summary, ''];
  for (const block of page.blocks) {
    if (block.type === 'h2') lines.push('## ' + block.text, '');
    if (block.type === 'p') lines.push(block.text, '');
    if (block.type === 'note') lines.push('> ' + block.text, '');
    if (block.type === 'code') lines.push('```' + (block.language || ''), block.text, '```', '');
    if (block.type === 'list') lines.push(...block.items.map(text => '- ' + text), '');
    if (block.type === 'table') lines.push('| ' + block.headers.join(' | ') + ' |', '| ' + block.headers.map(() => '---').join(' | ') + ' |', ...block.rows.map(row => '| ' + row.map(cell => cell.replaceAll('|', '\\|').replaceAll('\n', ' ')).join(' | ') + ' |'), '');
    if (block.type === 'links') lines.push(...block.items.map(link => '- [' + link.label + '](' + (link.href.startsWith('#wiki/') ? link.href.slice(6) : link.href === 'SECURITY.md' ? 'Security' : link.href) + ')'), '');
  }
  return lines.join('\n') + '\n';
};
for (const page of pages) { const text = markdown(page); await writeFile('wiki/' + page.id + '.md', text); await writeFile('dist/docs/' + page.id + '.md', text); }
await writeFile('wiki/_Sidebar.md', '# InoQuill\n\n' + pages.map(p => '- [' + p.title + '](' + p.id + ')').join('\n') + '\n');
await writeFile('wiki/_Footer.md', 'InoQuill by TabGrinder · Educational use only · [Disclaimer](Disclaimer)\n');
await writeFile('dist/wiki-data.mjs', 'export const wikiPages = ' + JSON.stringify(pages, null, 2) + ';\n');
await writeFile('DISCLAIMER.md', markdown(pages.find(p => p.id === 'Disclaimer')));
console.log('Generated ' + pages.length + ' wiki topics from docs/wiki-data.json.');

// Remove obsolete generated web/wiki guides; developer documents stay in docs/.
const retained = new Set(pages.map(page => page.id + '.md'));
for (const directory of ['wiki', 'dist/docs']) {
  for (const name of await readdir(directory)) {
    if (name.endsWith('.md') && !name.startsWith('_') && !retained.has(name)) await unlink(directory + '/' + name);
  }
}
