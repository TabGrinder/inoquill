import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {readImportedSketch} from '../dist/workbench-utils.mjs';

test('oversized imports are rejected before allocating their contents',async()=>{
 let read=false;
 await assert.rejects(readImportedSketch({size:200001,arrayBuffer:async()=>{read=true;return new ArrayBuffer(200001);}}),/200 KB/);
 assert.equal(read,false);
});
test('binary input is rejected by the shared import reader',async()=>{
 await assert.rejects(readImportedSketch(new Blob(['void setup(){}\0'])),/binary/);
});
test('CLI rejects whitespace-only startup delays without emitting a script',()=>{
 const r=spawnSync(process.execPath,['cli.mjs','examples/hello.ino','--delay','   '],{encoding:'utf8'});
 assert.equal(r.status,2);assert.equal(r.stdout,'');assert.match(r.stderr,/delay/i);
});
test('download names preserve their extension and avoid reserved Windows stems',async()=>{
 const source=await readFile('dist/app.mjs','utf8');let name;
 const context={URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},Blob,setTimeout(){},document:{createElement:()=>({set download(v){name=v;},click(){}})}};
 vm.runInNewContext(source.slice(source.indexOf('function save('),source.indexOf('for (const target of targets)')),context);
 context.save('{}','a'.repeat(200)+'.review.json','application/json');
 assert.ok(name.endsWith('.review.json'),name);assert.ok(name.length<=140);
 context.save('{}','CON.review.json','application/json');assert.ok(!/^con\./i.test(name),name);
});
