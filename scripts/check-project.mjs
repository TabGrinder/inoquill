import { readFile, access, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const html = await readFile('dist/index.html','utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]); assert.equal(new Set(ids).size,ids.length,'Duplicate HTML IDs');
for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){const url=match[1];if(url.startsWith('#')||url.startsWith('https://')||url.startsWith('data:'))continue;await access(path.join('dist',url));}
assert.match(html,/<html lang="en">/);assert.ok(!html.includes('→'),'Use to instead of the arrow');assert.match(html,/For educational purposes only/);assert.match(html,/TabGrinder/);
for(const file of ['dist/app.mjs','dist/converter.mjs','dist/expressions.mjs','dist/conversion-error.mjs','dist/targets.mjs','dist/worker.mjs','dist/wiki.mjs','dist/wiki-data.mjs','dist/workbench-utils.mjs','server.mjs','cli.mjs','cli-input.mjs'])execFileSync(process.execPath,['--check',file]);
for(const file of ['dist/app.mjs','dist/wiki.mjs']){const source=await readFile(file,'utf8');assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write\(/.test(source),'Unsafe HTML sink: '+file);}
assert.ok(!html.includes('Everything in one repository'));
for(const id of ['output-target','device-target','target-hint','device-hint'])assert.ok(ids.includes(id));
assert.match(html,/v1\.0/);
const converter=await readFile('dist/converter.mjs','utf8');assert.ok(!/\beval\s*\(|new\s+Function\s*\(/.test(converter));
const pages=JSON.parse(await readFile('docs/wiki-data.json','utf8'));const pageIds=new Set(pages.map(p=>p.id));assert.equal(pageIds.size,10);
for (const match of html.matchAll(/href="#wiki\/([^"]+)"/g)) assert.ok(pageIds.has(match[1]), 'Unknown interface guide: '+match[1]);
for(const page of pages){await access('wiki/'+page.id+'.md');for(const block of page.blocks){if(block.type==='links')for(const link of block.items)if(link.href.startsWith('#wiki/'))assert.ok(pageIds.has(link.href.slice(6)),'Unknown wiki page');}}
for(const name of await readdir('examples'))if(name.endsWith('.ino')&&name!=='sensor-unsupported.ino'){const {convert}=await import('../dist/converter.mjs');const result=convert(await readFile('examples/'+name,'utf8'));assert.equal(result.ok,true,name);assert.equal(result.script,await readFile('examples/'+name.replace('.ino','.expected.txt'),'utf8'),'Fixture mismatch: '+name);}
console.log('Project verified: English UI, local assets, wiki links, module syntax, text-only rendering and example fixtures.');

const policy = await readFile('SECURITY.md','utf8');
assert.match(policy, /Current maintained release line: \*\*1\.0\.x\*\*/);
assert.equal(JSON.parse(await readFile('package.json','utf8')).version, '1.0.0');
for (const match of html.matchAll(/aria-(?:describedby|labelledby)="([^"]+)"/g)) for (const id of match[1].split(/\s+/)) assert.ok(ids.includes(id), 'Missing accessibility reference: '+id);

assert.ok(!html.includes('inoquill-source.zip'), 'No project downloads in public UI');
for (const name of await readdir('dist')) assert.ok(!/\.(zip|tar|gz|sha256)$/i.test(name), 'Release artifacts must stay outside the public root');

// Resolve browser resources at the planned repository subpath, including the worker and lazy modules.
const pagesBase = new URL('https://tabgrinder.github.io/inoquill/');
async function checkPagesReference(reference, parent) {
  const url = new URL(reference, parent);
  assert.equal(url.origin, pagesBase.origin, 'Unexpected resource origin: '+reference);
  assert.ok(url.pathname.startsWith(pagesBase.pathname), 'Resource escapes Pages subpath: '+reference);
  await access(path.join('dist', decodeURIComponent(url.pathname.slice(pagesBase.pathname.length))));
}
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const ref = match[1];
  if (!/^(?:#|https:|data:)/.test(ref)) await checkPagesReference(ref, pagesBase);
}
for (const name of await readdir('dist')) {
  if (!name.endsWith('.mjs')) continue;
  const source = await readFile(path.join('dist',name),'utf8');
  const parent = new URL(name,pagesBase);
  for (const match of source.matchAll(/(?:from\s*|import\s*\(\s*|new URL\(\s*)['"]([^'"]+)['"]/g))
    if (match[1].startsWith('.')) await checkPagesReference(match[1],parent);
}
assert.ok(!JSON.stringify(pages).includes('Download project'), 'Wiki must not advertise a removed download control');
assert.match(await readFile('LICENSE','utf8'), /Copyright \(c\) 2026 TabGrinder/);
console.log('Pages subpath resource references, license attribution and current Wiki instructions verified.');
