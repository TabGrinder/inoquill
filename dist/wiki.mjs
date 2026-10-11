export { wikiPages } from './wiki-data.mjs';
function textNode(tag, text, className) { const element = document.createElement(tag); element.textContent = text; if (className) element.className = className; return element; }
function safeLink(label, href) {
  const element = textNode('a', label);
  if (href.startsWith('#wiki/') || /^https:\/\//.test(href)) element.href = href;
  else throw Error('Unsupported wiki link');
  if (href.startsWith('https://')) { element.target = '_blank'; element.rel = 'noopener noreferrer'; }
  return element;
}
export function renderWiki(container, page) {
  container.replaceChildren(textNode('div', 'INOQUILL / GUIDE / V1.0', 'wiki-meta'), textNode('h2', page.title, 'wiki-title'), textNode('p', page.summary));
  for (const block of page.blocks) {
    if (block.type === 'h2' || block.type === 'p') container.append(textNode(block.type === 'h2' ? 'h3' : block.type, block.text));
    else if (block.type === 'note') container.append(textNode('div', block.text, 'callout'));
    else if (block.type === 'code') { const pre = document.createElement('pre'); pre.append(textNode('code', block.text)); container.append(pre); }
    else if (block.type === 'list') { const list = document.createElement('ul'); for (const item of block.items) list.append(textNode('li', item)); container.append(list); }
    else if (block.type === 'links') { const list = document.createElement('ul'); for (const link of block.items) { const item = document.createElement('li'); item.append(safeLink(link.label, link.href)); list.append(item); } container.append(list); }
    else if (block.type === 'table') {
      const wrapper = document.createElement('div'); wrapper.className = 'table-scroll'; const table = document.createElement('table'), head = document.createElement('thead'), header = document.createElement('tr');
      for (const title of block.headers) { const th = textNode('th', title); th.scope = 'col'; header.append(th); } head.append(header); table.append(head);
      const body = document.createElement('tbody'); for (const row of block.rows) { const tr = document.createElement('tr'); for (const cell of row) tr.append(textNode('td', cell)); body.append(tr); } table.append(body); wrapper.append(table); container.append(wrapper);
    }
  }
}
