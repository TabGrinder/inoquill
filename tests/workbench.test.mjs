import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createImportGate, wikiSearchIndex, matchesWiki, readImportedSketch } from '../dist/workbench-utils.mjs';
import { wikiPages } from '../dist/wiki-data.mjs';
test('imports: latest selection wins regardless of read completion order', async () => {
  const source = await readFile('dist/app.mjs','utf8');
  for (const order of [[0,1],[1,0]]) {
    const pending = []; const files = ['first.ino','last.ino'].map(name=>({ name, size:20, arrayBuffer:()=>new Promise(resolve=>pending.push(resolve)) }));
    const nodes={file:{files:[]},input:{value:'initial'},filename:{}};
    const context={$:id=>nodes[id],job:1,importGate:createImportGate(),readImportedSketch,toast(){},rememberSketch(){},resetExportName(){},filename:'',invalidate(){context.job++;}};
    vm.runInNewContext(source.slice(source.indexOf("$('file').onchange ="),source.indexOf("$('copy').onclick")),context);
    nodes.file.files=[files[0]]; const first=nodes.file.onchange();
    nodes.file.files=[files[1]]; const last=nodes.file.onchange();
    const jobs=[first,last];
    for (const index of order) { pending[index](new TextEncoder().encode(['first source','last source'][index]).buffer); await jobs[index]; }
    assert.equal(nodes.input.value,'last source'); assert.equal(nodes.filename.textContent,'last.ino');
  }
});
test('search: matches guide bodies, tables and code with all query words', () => {
  const page={title:'Guide',summary:'Résumé',tags:[],blocks:[{type:'code',text:'DigiKeyboard.delay(3000)'},{type:'table',headers:['Limits'],rows:[['milliseconds','4294967295']]},{type:'links',items:[{label:'Device instructions',href:'#wiki/Output-Targets'}]}]};
  const index=wikiSearchIndex(page);
  assert.equal(matchesWiki(index,'DELAY 3000'),true);
  assert.equal(matchesWiki(index,'resume'),true);
  assert.equal(matchesWiki(index,'4294967295 milliseconds'),true);
  assert.equal(matchesWiki(index,'device instructions'),true);
  assert.equal(matchesWiki(index,'delay missing'),false);
  assert.equal(matchesWiki(index,'  '),true);
  assert.ok(wikiPages.some(p=>matchesWiki(wikiSearchIndex(p),'sendKeyStroke')));
});
test('conversion: repeated shortcut cannot restart an active worker', async()=>{
  const source=await readFile('dist/app.mjs','utf8');
  const context={worker:{},$:()=>{throw Error('Active job must not read or invalidate input');}};
  vm.runInNewContext(source.slice(source.indexOf('function run()'),source.indexOf('function save(')).replace('import.meta.url', '"https://example.invalid/app.mjs"'),context);
  context.run();
});
test('clipboard: a failed stale copy cannot focus or select newer output', async()=>{
  const source=await readFile('dist/app.mjs','utf8'); let reject;
  const pending=new Promise((_,fail)=>{reject=fail;});
  const context={result:{ok:true,script:'STRING harmless'},job:1,navigator:{clipboard:{writeText:()=>pending}},$:()=>{throw Error('Stale copy must not select the new output');},toast(){}};
  vm.runInNewContext(source.slice(source.indexOf("$('copy').onclick ="),source.indexOf("$('download').onclick" )).replace("$('copy').onclick =",'copy ='),context);
  const operation=context.copy();context.job=2;context.result=null;reject(Error('Clipboard denied'));await operation;
});
test('browser import rejects malformed UTF-8 instead of silently replacing bytes',async()=>{
 const valid=new Blob(['\uFEFFvoid setup(){}']);assert.equal(await readImportedSketch(valid),'void setup(){}');
 await assert.rejects(readImportedSketch(new Blob([new Uint8Array([0xff,0xfe])])),/valid UTF-8/);
 await assert.rejects(readImportedSketch(new Blob(['x'.repeat(200001)])),/200 KB/);
});
