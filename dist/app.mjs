import { createImportGate, wikiSearchIndex, matchesWiki, readImportedSketch, createCachedLoader, createSketchHistory, outputFilename, bugReportTemplate } from './workbench-utils.mjs';
import { targets, languageHints } from './targets.mjs';
import { examples } from './examples.mjs';
const $ = id => document.getElementById(id);
// Theme selection is kept in memory; no browser storage is used.
const systemTheme = matchMedia('(prefers-color-scheme: light)');
let manualTheme = false;
function applyTheme(theme) {
  const dark = theme === 'dark';
  document.documentElement.dataset.theme = theme;
  $('theme-toggle').setAttribute('aria-pressed', String(dark));
  $('theme-toggle').setAttribute('aria-label', 'Switch to ' + (dark ? 'light' : 'dark') + ' mode');
  $('theme-label').textContent = dark ? 'Light mode' : 'Dark mode';
  $('theme-icon').textContent = dark ? '☼' : '◐';
  document.querySelector('meta[name="theme-color"]').content = dark ? '#08090b' : '#f4f3ef';
}
applyTheme(systemTheme.matches ? 'light' : 'dark');
$('theme-toggle').onclick = () => { manualTheme = true; applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); };
systemTheme.addEventListener('change', event => { if (!manualTheme) applyTheme(event.matches ? 'light' : 'dark'); });
const importGate = createImportGate();
const sketchHistory = createSketchHistory();
function rememberSketch() {
  sketchHistory.push({ source: $('input').value, filename, exportName: $('export-name').value });
  $('undo').disabled = false;
}
function resetExportName() { $('export-name').value = filename.replace(/\.[^.]+$/, ''); updateExportPreview(); }
function updateExportPreview() { $('export-preview').textContent = outputFilename($('export-name').value, $('output-target').value); }

let result = null, filename = 'sketch.ino', job = 0, worker = null, timeout = null, toastTimer = null;
const toast = message => {
  $('toast').textContent = message; $('toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3500);
};
function gutter(id, text) { $(id).textContent = Array.from({ length: Math.max(1, text.split('\n').length) }, (_, i) => i + 1).join('\n'); }
function updateMetadata() {
  const source = $('input').value;
  gutter('input-gutter', source);
  $('source-count').textContent = source.split('\n').length + (source.split('\n').length === 1 ? ' line' : ' lines');
  $('library').textContent = /\bDigiKeyboard\./.test(source) && /\bKeyboard\./.test(source) ? 'Mixed' : /\bDigiKeyboard\./.test(source) ? 'DigiKeyboard' : /\bKeyboard\./.test(source) ? 'Keyboard' : 'C++';
  $('loop-hint').textContent = { once: 'Converts setup(), followed by one pass through loop(). This is a good place to start.', repeat: 'Converts setup() once, then repeats loop(). The delay total covers setup and one pass through the loop.', setup: 'Converts setup() only. Nothing from loop() is included.' }[$('loop-mode').value];
}
function stopWorker() { worker?.terminate(); worker = null; clearTimeout(timeout); timeout = null; $('convert').disabled = false; $('convert').firstChild.textContent = 'Convert sketch '; }
function invalidate() {
  job++; stopWorker(); result = null; $('export-panel').hidden = true; $('result-banner').hidden = true; $('output').value = ''; gutter('output-gutter', '');
  for (const id of ['copy', 'download', 'export-download', 'report']) $(id).disabled = true;
  $('result-state').textContent = $('input').value.trim() ? 'Ready to convert' : 'Add a sketch to get started'; $('result-state').parentElement.className = 'editor-foot';
  $('diagnostic-list').replaceChildren(); $('diagnostic-sub').textContent = $('input').value.trim() ? 'Convert to check the current sketch and settings.' : 'Import a sketch, paste your code, or try an example.';
  $('trace-body').replaceChildren(); $('trace-count').textContent = 'No output yet';
  for (const id of ['metric-commands', 'metric-delay', 'metric-warnings']) $(id).textContent = '—';
  updateMetadata();
}
function focusLine(line) {
  const lines = $('input').value.split('\n'), at = Math.max(1, Math.min(line, lines.length));
  const start = lines.slice(0, at - 1).reduce((sum, str) => sum + str.length + 1, 0);
  $('input').focus(); $('input').setSelectionRange(start, start + lines[at - 1].length);
  const lineHeight = parseFloat(getComputedStyle($('input')).lineHeight);
  $('input').scrollTop = Math.max(0, (at - 4) * lineHeight); $('input-gutter').scrollTop = $('input').scrollTop;
}
function hint(message, severity) {
  if (severity === 'info') return '';
  if (/\$ reference/i.test(message)) return 'DuckyScript may interpret this text as a variable reference. The Text and escaping guide explains the limitation.';
  if (/resolve|sensor|call/i.test(message)) return 'Check whether this value or function is supported in the Compatibility guide. A value that depends on a sensor or the host needs to be handled separately.';
  if (/loop|iteration|steps/i.test(message)) return 'Check how the loop ends and how many times it repeats. See Control flow and scope for the supported limits.';
  if (/ASCII|interpolation|reference \$/i.test(message)) return 'Check the characters in this text and the keyboard layout you plan to use. See Text and escaping for supported characters.';
  if (/at least/i.test(message)) return 'The selected DuckyScript version requires a longer delay. Adjust it in your sketch only if the new timing works for your sequence.';
  if (/range|delay|overflow/i.test(message)) return 'Check the value against the limits in the Compatibility guide.';
  if (/held|HOLD|mask|modifier|key/i.test(message)) return 'See Key codes and modifiers for supported keys and how to press and release them.';
  if (/GPIO|omitted/i.test(message)) return 'This operation affects the Arduino board and is left out of the output. Check whether your sequence needs it.';
  return '';
}
function showResult(next) {
  result = next; $('export-panel').hidden = !next.ok; updateExportPreview(); $('output').value = next.ok ? next.script : 'REM Conversion could not finish.\nREM Check the errors below, update your sketch, and try again.';
  gutter('output-gutter', $('output').value); $('output').scrollTop = $('output-gutter').scrollTop = 0;
  $('result-state').textContent = next.ok ? 'Ready to review' : 'Check the errors below';
  $('result-state').parentElement.className = 'editor-foot ' + (next.ok ? 'success' : 'error');
  for (const id of ['copy', 'download', 'export-download']) $(id).disabled = !next.ok; $('report').disabled = false;
  const errors = next.diagnostics.filter(d => d.severity === 'error');
  $('result-banner').hidden = false;
  $('result-banner').className = 'result-banner ' + (next.ok ? 'success' : 'error');
  $('result-banner-text').textContent = next.ok ? 'Translation ready for review. Check the notices and test it on your device; conversion does not verify device behavior.' : errors.length + ' blocking error' + (errors.length === 1 ? '' : 's') + '. Line ' + errors[0].line + ': ' + errors[0].message;
  $('result-help').href = next.ok ? '#wiki/Output-Targets' : '#wiki/Diagnostics';
  $('result-help').textContent = next.ok ? 'Device instructions' : 'Troubleshooting guide';
  const warnings = next.diagnostics.filter(d => d.severity === 'warning').length;
  $('metric-commands').textContent = next.ok ? next.stats.commands : '—';
  $('metric-delay').textContent = next.ok ? (next.stats.delayMs / 1000).toLocaleString('en-US') + ' s' : '—';
  $('metric-warnings').textContent = warnings;
  $('summary-note').textContent = $('loop-mode').value === 'repeat' ? 'Includes setup and one pass through loop(). The full script repeats until stopped.' : 'Includes delays in the script. Typing and USB communication take additional time.';
  $('diagnostic-sub').textContent = next.ok ? (warnings ? 'No errors. ' + warnings + (warnings === 1 ? ' notice to review.' : ' notices to review.') : 'No errors or review notices.') : 'Check the errors below, update your sketch, and convert again to download the script.';
  $('diagnostic-list').replaceChildren();
  for (const d of [...next.diagnostics].sort((a,b) => ({error:0,warning:1,info:2}[a.severity] - {error:0,warning:1,info:2}[b.severity]))) {
    const row = document.createElement('div'); row.className = 'diagnostic-row';
    const severity = document.createElement('span'); severity.className = 'severity ' + d.severity; severity.textContent = { error: 'ERROR', warning: 'REVIEW', info: 'INFO' }[d.severity];
    const message = document.createElement('div'); message.className = 'diagnostic-message'; message.textContent = d.message;
    const help = hint(d.message, d.severity); if (help) { const text = document.createElement('small'); text.textContent = help; message.append(text); const guide = document.createElement('a'); guide.textContent = 'Open guide'; guide.href = /loop|iteration|steps/i.test(d.message) ? '#wiki/Control-Flow' : /ASCII|interpolation|reference \$|\$ reference/i.test(d.message) ? '#wiki/Text' : /held|mask|modifier|key/i.test(d.message) ? '#wiki/Keys' : '#wiki/Compatibility'; guide.className = 'diagnostic-guide'; message.append(guide); }
    const line = document.createElement('button'); line.className = 'line-link'; line.textContent = 'Line ' + d.line; line.onclick = () => focusLine(d.line);
    row.append(severity, message, line); $('diagnostic-list').append(row);
  }
  $('trace-body').replaceChildren();
  const outputLines = next.ok ? next.script.trimEnd().split('\n') : [];
  $('trace-count').textContent = next.ok ? outputLines.length + (outputLines.length === 1 ? ' line' : ' lines') + (outputLines.length > 250 ? ' · showing the first 250; download the report for the rest' : '') : 'Available after a successful conversion';
  for (const map of next.sourceMap.slice(0, 250)) {
    if (!next.ok) break;
    const row = document.createElement('tr'), number = document.createElement('td'), command = document.createElement('td'), source = document.createElement('td');
    number.textContent = map.outputLine;
    const code = document.createElement('code'); code.textContent = outputLines[map.outputLine - 1] || ''; command.append(code);
    const link = document.createElement('button'); link.className = 'line-link'; link.textContent = 'Line ' + map.sourceLine; link.onclick = () => focusLine(map.sourceLine); source.append(link);
    row.append(number, command, source); $('trace-body').append(row);
  }
  updateMetadata();
}
function failConversion(message) {
  invalidate(); $('result-banner').hidden = false; $('result-banner').className = 'result-banner error';
  $('result-banner-text').textContent = message; $('result-help').href = '#wiki/Diagnostics'; $('result-help').textContent = 'Troubleshooting guide';
  $('result-state').textContent = 'Could not complete conversion'; $('diagnostic-sub').textContent = message;
}
function run() {
  if (worker) return;
  const source = $('input').value;
  if (!source.trim()) { invalidate(); toast('Paste your code, import a file, or choose an example first.'); return; }
  if (source.length > 200000) { invalidate(); toast('This sketch is too long. Use 200,000 characters or fewer.'); return; }
  const initialDelayText = $('initial-delay').value.trim();
  const initialDelay = Number(initialDelayText);
  if (!initialDelayText || !Number.isInteger(initialDelay) || initialDelay < 0 || initialDelay > 4294967295) { failConversion('Enter a whole startup delay from 0 to 4,294,967,295 milliseconds.'); return; }
  invalidate(); const id = ++job;
  $('convert').disabled = true; $('convert').firstChild.textContent = 'Converting… ';
  for (const key of ['copy', 'download', 'export-download', 'report']) $(key).disabled = true;
  $('result-state').textContent = 'Reading your sketch…';
  const options = { loop: $('loop-mode').value, initialDelay, comments: $('comments').checked, target: $('output-target').value, device: $('device-target').value };
  try {
    worker = new Worker(new URL('./worker.mjs', import.meta.url), { type: 'module' });
    timeout = setTimeout(() => { if (id !== job) return; stopWorker(); failConversion('Conversion took longer than 3 seconds. Try a smaller sketch or reduce the number of loop iterations.'); }, 3000);
    worker.onmessage = ({ data }) => { if (data.id !== job) return; stopWorker(); if (data.failure) { failConversion(data.failure); } else showResult(data.result); };
    worker.onerror = () => { if (id !== job) return; stopWorker(); failConversion('The converter could not load. Reload the page and try again. If you are running a local copy, open it through an HTTP or HTTPS server.'); };
    worker.postMessage({ id, source, options });
  } catch { stopWorker(); failConversion('The converter could not start. Open the page over HTTP or HTTPS in an up-to-date browser and try again.'); }
}
function save(content, name, type = 'text/plain;charset=utf-8') {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 140) || 'inoquill.txt';
  const url = URL.createObjectURL(new Blob([content], { type })), link = document.createElement('a');
  link.href = url; link.download = safe; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
for (const target of targets) { const option = document.createElement('option'); option.value = target.id; option.textContent = target.name; $('device-target').append(option); }
$('device-target').value = 'rubber-ducky-2022';
function updateTarget(changed) {
  if (changed === 'device') { const target = targets.find(t => t.id === $('device-target').value); if (target.language) $('output-target').value = target.language; }
  if (changed === 'language') { const current = targets.find(t => t.id === $('device-target').value); if (current.language && current.language !== $('output-target').value) $('device-target').value = ({'1.0':'rubber-ducky-classic','2.0':'bash-bunny','3.0':'rubber-ducky-2022'})[$('output-target').value]; }
  const language = $('output-target').value, target = targets.find(t => t.id === $('device-target').value);
  $('target-name').textContent = target.name; $('target-format').textContent = 'DuckyScript ' + language + ' source'; $('target-pill').textContent = language;
  $('target-hint').textContent = languageHints[language]; $('device-hint').textContent = target.hint;
  const repeat = $('loop-mode').querySelector('option[value="repeat"]'); repeat.disabled = language !== '3.0';
  if (repeat.disabled && $('loop-mode').value === 'repeat') { $('loop-mode').value = 'once'; toast('Continuous repetition needs DuckyScript 3.0. Switched to one pass through loop() for this device.'); }
  $('initial-delay').min = '0'; updateExportPreview(); invalidate();
}
$('output-target').addEventListener('change', () => updateTarget('language'));
$('device-target').addEventListener('change', () => updateTarget('device'));
updateTarget('device');
$('convert').onclick = run; $('import').onclick = () => $('file').click();
$('input').addEventListener('input', invalidate);
for (const id of ['loop-mode', 'comments']) $(id).addEventListener('change', invalidate);
$('initial-delay').addEventListener('input', invalidate);
for (const [input, lineNumbers] of [['input', 'input-gutter'], ['output', 'output-gutter']]) $(input).addEventListener('scroll', () => { $(lineNumbers).scrollTop = $(input).scrollTop; });
$('input').addEventListener('keydown', event => { if (event.altKey && event.key === 'Tab') { event.preventDefault(); $('input').setRangeText('  ', $('input').selectionStart, $('input').selectionEnd, 'end'); invalidate(); } });
document.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !$('workspace').hidden) { event.preventDefault(); run(); } });
$('example').onchange = () => { const example = examples[$('example').value]; if (!example) return; rememberSketch(); $('input').value = example.code; filename = example.name; $('filename').textContent = filename; resetExportName(); invalidate(); run(); $('example').value = ''; };
$('clear').onclick = () => { rememberSketch(); $('input').value = ''; filename = 'sketch.ino'; $('filename').textContent = filename; resetExportName(); invalidate(); $('input').focus(); };
$('file').onchange = async () => {
  const file = $('file').files[0]; if (!file) return; const importTicket = importGate.begin(job);
  try {
    if (file.size > 200000) throw Error('This file is too large. Choose one that is 200 KB or smaller.');
    if (!/\.(ino|cpp|txt)$/i.test(file.name)) throw Error('Choose an .ino, .cpp, or .txt file.');
    const text = await readImportedSketch(file); if (!importGate.canApply(importTicket, job)) { if (importGate.isLatest(importTicket)) toast('The workspace changed while the file was loading. Import it again if you still want to use it.'); return; } if (text.includes('\0')) throw Error('The file contains binary data. Choose a plain-text sketch.');
    rememberSketch(); $('input').value = text; filename = file.name; $('filename').textContent = filename; resetExportName(); invalidate(); toast('Sketch loaded. Choose your device, then select Convert sketch.');
  } catch (error) { if (importGate.canApply(importTicket, job)) toast(error.message); } finally { if (importGate.isLatest(importTicket)) $('file').value = ''; }
};
$('copy').onclick = async () => {
  if (!result?.ok) return;
  const copiedResult = result, revision = job;
  try {
    await navigator.clipboard.writeText(copiedResult.script);
    toast(revision === job && copiedResult === result ? 'DuckyScript copied.' : 'Copied the earlier script. Convert again to include your latest changes.');
  } catch {
    if (revision !== job || copiedResult !== result) return;
    $('output').focus(); $('output').select(); toast('Copy the selected text with Ctrl+C on Windows or Linux, or Command+C on Mac.');
  }
};
$('download').onclick = () => { if (result?.ok) save(result.script, outputFilename($('export-name').value, result.options.target)); };
$('export-download').onclick = $('download').onclick;
$('export-name').addEventListener('input', updateExportPreview);
$('undo').onclick = () => {
  const previous = sketchHistory.pop(); if (!previous) return;
  $('input').value = previous.source; filename = previous.filename; $('filename').textContent = filename;
  $('export-name').value = previous.exportName; $('undo').disabled = sketchHistory.size === 0;
  updateExportPreview(); invalidate(); $('input').focus(); toast('Previous sketch restored. Convert again to review it.');
};
$('bug-report').onclick = () => {
  const options = { target: $('output-target').value, device: $('device-target').value, loop: $('loop-mode').value, initialDelay: Number($('initial-delay').value), comments: $('comments').checked };
  save(bugReportTemplate({version: '1.0.0', options, browser: navigator.userAgent}), 'inoquill-bug-report.md', 'text/markdown;charset=utf-8');
  toast('Bug report downloaded. Review it before sharing; no code was attached.');
};
$('report').onclick = () => { if (result) { const { partialScript, ...report } = result; save(JSON.stringify({ ...report, filename, maintainer: 'TabGrinder', partialOutputExcluded: true }, null, 2), filename.replace(/\.[^.]+$/, '') + '.review.json', 'application/json'); } };
const loadWiki = createCachedLoader(async () => {
  const module = await import('./wiki.mjs');
  const wikiIndexes = new Map(module.wikiPages.map(page => [page.id, wikiSearchIndex(page)]));
  for (const page of module.wikiPages) {
    const link = document.createElement('a'); link.href = '#wiki/' + page.id;
    link.dataset.page = page.id; link.textContent = page.title; $('wiki-links').append(link);
  }
  $('wiki-search').addEventListener('input', () => {
    let count = 0;
    for (const link of $('wiki-links').querySelectorAll('a')) {
      link.hidden = !matchesWiki(wikiIndexes.get(link.dataset.page), $('wiki-search').value);
      if (!link.hidden) count++;
    }
    $('wiki-empty').hidden = count > 0;
    $('wiki-search-status').textContent = count + (count === 1 ? ' topic found' : ' topics found');
  });
  return module;
});
let routeRevision = 0;
async function route(event) {
  const revision = ++routeRevision;
  const [key, topic] = location.hash.slice(1).split('/');
  const view = ['wiki', 'project'].includes(key) ? key : 'workspace';
  for (const section of document.querySelectorAll('.view')) section.hidden = section.id !== view;
  for (const link of document.querySelectorAll('header [data-tab]')) {
    const active = link.dataset.tab === view; link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  }
  if (view === 'wiki') {
    const article = $('wiki-article'); article.setAttribute('aria-busy', 'true');
    try {
      const { wikiPages, renderWiki } = await loadWiki();
      if (revision !== routeRevision) return;
      renderWiki(article, wikiPages.find(page => page.id === topic) || wikiPages[0]);
      const pageId = (wikiPages.find(page => page.id === topic) || wikiPages[0]).id;
      for (const link of $('wiki-links').querySelectorAll('a')) {
        const active = link.dataset.page === pageId; link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
      }
    } catch {
      if (revision !== routeRevision) return;
      const title = document.createElement('h2'); title.className = 'wiki-title'; title.textContent = 'Could not open this guide';
      const help = document.createElement('p'); help.textContent = 'This guide could not be loaded. Try again. Your sketch and output have not changed.';
      const retry = document.createElement('button'); retry.textContent = 'Try again'; retry.onclick = () => route();
      article.replaceChildren(title, help, retry);
    } finally { if (revision === routeRevision) article.setAttribute('aria-busy', 'false'); }
  } else $('wiki-article').setAttribute('aria-busy', 'false');
  if (revision === routeRevision && event?.type === 'hashchange') {
    const heading = $(view).querySelector(view === 'wiki' ? '.wiki-title' : 'h1');
    heading.setAttribute('tabindex', '-1'); heading.focus();
  }
}
window.addEventListener('hashchange', route); route();
$('input').value = examples.digi.code; filename = examples.digi.name; $('filename').textContent = filename; resetExportName(); updateMetadata(); run();
