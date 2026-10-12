// Import ordering is independent of converter revisions.
export function createImportGate() {
  let latest = 0;
  return {
    begin(revision) { return { sequence: ++latest, revision }; },
    isLatest(ticket) { return ticket.sequence === latest; },
    canApply(ticket, revision) { return ticket.sequence === latest && ticket.revision === revision; }
  };
}
export function searchText(value) {
  return String(value).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
}
export function wikiSearchIndex(page) {
  const contents = page.blocks.flatMap(block => [block.text ?? '', ...(block.headers ?? []), ...(block.rows ?? []).flat(), ...(block.items ?? []).map(item => typeof item === 'string' ? item : item.label)]);
  return searchText([page.title, page.summary, page.tags, ...contents].join(' '));
}
export function matchesWiki(index, query) {
  return searchText(query).trim().split(/\s+/).filter(Boolean).every(word => index.includes(word));
}
export async function readImportedSketch(file) {
  if (file.size > 200000) throw Error('This file is too large. Choose one that is 200 KB or smaller.');
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > 200000) throw Error('This file is too large. Choose one that is 200 KB or smaller.');
  let source;
  try { source = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw Error('The file is not valid UTF-8. Save your sketch as UTF-8 and try again.'); }
  if (source.includes('\0')) throw Error('The file contains binary data. Choose a plain-text sketch.');
  return source;
}
// Cache successful optional assets; failed loads can be retried.
export function createCachedLoader(load) {
  let pending;
  return () => pending ??= Promise.resolve().then(load).catch(error => { pending = undefined; throw error; });
}

// Keep a bounded undo history in memory, never in browser storage.
export function createSketchHistory(limit = 5) {
  const entries = [];
  return {
    push(snapshot) { entries.push({ ...snapshot }); if (entries.length > limit) entries.shift(); },
    pop() { return entries.pop() ?? null; },
    get size() { return entries.length; }
  };
}
export function outputFilename(base, target) {
  let stem = String(base).normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'sketch';
  if (/^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i.test(stem)) stem = 'sketch-' + stem;
  const version = ['1.0', '2.0', '3.0'].includes(target) ? target : '3.0';
  return stem + '.ducky' + version + '.txt';
}
export function bugReportTemplate({ version, options, browser }) {
  return '# InoQuill bug report\n\nVersion: ' + version + '\nBrowser: ' + browser +
    '\n\n## Settings\n\n```json\n' + JSON.stringify(options, null, 2) + '\n```\n\n' +
    '## What happened?\n\nDescribe what you expected and what happened instead.\n\n' +
    '## Steps to reproduce\n\n1. \n\n## Device and environment\n\nDevice / firmware:\nKeyboard layout:\nOperating system:\n\n' +
    '## Small example (optional)\n\nAdd a harmless, redacted sketch if needed. No sketch or output was attached automatically.\n' +
    '\nIssue form: https://github.com/TabGrinder/inoquill/issues/new?template=bug_report.yml\n\nReview this file before sharing. Remove private information. Report security vulnerabilities privately using SECURITY.md.\n';
}
