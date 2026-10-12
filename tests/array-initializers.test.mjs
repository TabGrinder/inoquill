import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {convert} from '../dist/converter.mjs';
const invalid=[
 'char a[]="ABC";char b[]=a;',
 'const char *p="ABC";char b[]=p;',
 'char *b[]="ABC";'
];
test('C++ compiler independently rejects array initializers used by these regressions',()=>{
 for(const declarations of invalid){
  const r=spawnSync('g++',['-std=c++17','-pedantic-errors','-fsyntax-only','-x','c++','-'],{input:'void setup(){'+declarations+'}',encoding:'utf8'});
  assert.ifError(r.error);assert.notEqual(r.status,0,declarations);assert.match(r.stderr,/error:/);
 }
});
for(const target of ['1.0','2.0','3.0'])test(target+': invalid char array initialization never produces exportable output',()=>{
 for(const declarations of invalid){
  const r=convert('void setup(){'+declarations+'Keyboard.print(b);}',{target});
  assert.equal(r.ok,false,declarations);assert.equal(r.script,'');
 }
 const valid=convert('#define TEXT "ABC"\nvoid setup(){char b[]=TEXT;Keyboard.print(b);}',{target});
 assert.equal(valid.ok,true,JSON.stringify(valid.diagnostics));assert.match(valid.script,/STRING ABC/);
});
