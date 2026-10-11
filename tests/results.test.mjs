import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import { createImportGate, readImportedSketch } from '../dist/workbench-utils.mjs';
const element=()=>({children:[],parentElement:{},append(...items){this.children.push(...items);},replaceChildren(...items){this.children=items;}});
test('results: blocking errors appear first and remain visible with exports disabled',async()=>{
 const source=await readFile('dist/app.mjs','utf8');const nodes=new Map();const $=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);};$('loop-mode').value='once';
 const context={$ ,document:{createElement:element},gutter(){},invalidate(){},updateMetadata(){},updateExportPreview(){},focusLine(){},result:null};
 vm.runInNewContext(source.slice(source.indexOf('function hint('),source.indexOf('function run()')),context);
 context.showResult({ok:false,script:'',diagnostics:[{severity:'info',message:'USB state only',line:1},{severity:'warning',message:'GPIO omitted',line:2},{severity:'error',message:'Unsupported operation',line:14}],sourceMap:[],stats:{}});
 assert.equal($('diagnostic-list').children[0].children[0].textContent,'ERROR');assert.match($('result-banner-text').textContent,/Line 14/);assert.equal($('result-banner').hidden,false);assert.equal($('download').disabled,true);
 context.failConversion('Worker timed out');assert.equal($('result-banner-text').textContent,'Worker timed out');
});
test('imports: a pending file read cannot overwrite a changed workspace',async()=>{
 const source=await readFile('dist/app.mjs','utf8');let resolve;const pending=new Promise(r=>resolve=r);const nodes={file:{files:[{name:'example.ino',size:10,arrayBuffer:()=>pending}]},input:{value:'newer source'}};
 const context={$:id=>nodes[id],importGate:createImportGate(),readImportedSketch,job:1,toast:message=>context.message=message,invalidate(){throw Error('Must not overwrite edited workspace');}};
 vm.runInNewContext(source.slice(source.indexOf("$('file').onchange ="),source.indexOf("$('copy').onclick")),context);
 const operation=nodes.file.onchange();context.job=2;resolve(new TextEncoder().encode('older imported source').buffer);await operation;
 assert.equal(nodes.input.value,'newer source');assert.match(context.message,/workspace changed/);
});
