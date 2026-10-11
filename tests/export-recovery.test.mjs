import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createSketchHistory, outputFilename, bugReportTemplate} from '../dist/workbench-utils.mjs';
import {convert} from '../dist/converter.mjs';
import {examples} from '../dist/examples.mjs';
import {targets} from '../dist/targets.mjs';

test('undo history is bounded, copies snapshots, and restores in reverse order',()=>{
 const history=createSketchHistory();
 for(let i=0;i<7;i++){const entry={source:'sketch '+i,filename:i+'.ino'};history.push(entry);entry.source='changed';}
 assert.equal(history.size,5);
 for(let i=6;i>=2;i--)assert.equal(history.pop().source,'sketch '+i);
 assert.equal(history.pop(),null);
});
test('export names cannot contain paths, reserved device names, or a misleading extension',()=>{
 assert.equal(outputFilename('hello','1.0'),'hello.ducky1.0.txt');
 assert.equal(outputFilename('CON','2.0'),'sketch-CON.ducky2.0.txt');
 assert.equal(outputFilename('../../x.exe','3.0'),'x-exe.ducky3.0.txt');
 assert.equal(outputFilename('💛','3.0'),'sketch.ducky3.0.txt');
 assert.ok(outputFilename('x'.repeat(1000),'3.0').length<100);
 for(const version of ['1.0','2.0','3.0'])assert.ok(outputFilename('a/b\\c\n',''+version).endsWith('.ducky'+version+'.txt'));
});
test('bug report records settings without copying sketch text or output',()=>{
 const template=bugReportTemplate({version:'1.0.0',options:{target:'2.0',device:'key-croc'},browser:'Test browser',source:'PRIVATE_SKETCH',script:'PRIVATE_OUTPUT'});
 assert.match(template,/key-croc/);assert.match(template,/Test browser/);
 assert.doesNotMatch(template,/PRIVATE_SKETCH|PRIVATE_OUTPUT|\bBETA\b/i);
 assert.match(template,/No sketch or output was attached automatically/);
});
test('punctuation example converts for every device preset and retains the text',()=>{
 for(const device of targets){const target=device.language||'3.0';const r=convert(examples.layout.code,{target,device:device.id});
 assert.equal(r.ok,true,device.id+': '+JSON.stringify(r.diagnostics));
 assert.match(r.script,/Keyboard check: ABC xyz 0123456789/);
 assert.match(r.script,/! @ # % & \* \( \)/);
 assert.equal(r.stats.delayMs,3000);
 }
});
test('undo restores source, original filename and export name, then invalidates old output',async()=>{
 const code=await readFile('dist/app.mjs','utf8');const history=createSketchHistory();history.push({source:'saved source',filename:'saved.ino',exportName:'custom'});
 const nodes={undo:{},input:{value:'replacement',focus(){}},filename:{},'export-name':{}};let invalidated=0;
 const ctx={$:id=>nodes[id],sketchHistory:history,filename:'replacement.ino',updateExportPreview(){},invalidate(){invalidated++},toast(){}};
 vm.runInNewContext(code.slice(code.indexOf("$('undo').onclick ="),code.indexOf("$('bug-report').onclick")),ctx);
 nodes.undo.onclick();assert.equal(nodes.input.value,'saved source');assert.equal(ctx.filename,'saved.ino');assert.equal(nodes['export-name'].value,'custom');assert.equal(nodes.undo.disabled,true);assert.equal(invalidated,1);
});
test('custom filename uses the successful result target and failed results cannot download',async()=>{
 const code=await readFile('dist/app.mjs','utf8');const nodes={download:{},'export-download':{},'export-name':{value:'report'}};const saves=[];
 const ctx={$:id=>nodes[id],outputFilename,result:{ok:true,script:'STRING Hello',options:{target:'2.0'}},save:(...args)=>saves.push(args)};
 vm.runInNewContext(code.slice(code.indexOf("$('download').onclick ="),code.indexOf("$('export-name').addEventListener")),ctx);
 nodes.download.onclick();assert.deepEqual(saves[0],['STRING Hello','report.ducky2.0.txt']);ctx.result={ok:false};nodes.download.onclick();assert.equal(saves.length,1);
});
