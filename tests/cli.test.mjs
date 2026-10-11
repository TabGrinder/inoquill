import { test } from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {mkdtempSync,readFileSync,rmSync} from 'node:fs';import os from 'node:os';import path from 'node:path';
const run = args => spawnSync(process.execPath,['cli.mjs',...args],{encoding:'utf8'});
test('CLI converts, reports and refuses to overwrite',()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'inoquill-cli-')),out=path.join(dir,'script.txt'),report=path.join(dir,'report.json');
 try{const result=run(['examples/hello.ino','--out',out,'--report',report]);assert.equal(result.status,0,result.stderr);assert.match(readFileSync(out,'utf8'),/Hello from InoQuill/);assert.equal(JSON.parse(readFileSync(report,'utf8')).ok,true);assert.equal('partialScript' in JSON.parse(readFileSync(report,'utf8')),false);const before=readFileSync(out,'utf8');const overwrite=run(['examples/hello.ino','--out',out]);assert.equal(overwrite.status,2);assert.equal(readFileSync(out,'utf8'),before);}finally{rmSync(dir,{recursive:true,force:true});}
});
test('CLI blocks invalid translations and rejects unknown arguments',()=>{const blocked=run(['examples/sensor-unsupported.ino']);assert.equal(blocked.status,1);assert.equal(blocked.stdout,'');assert.equal(run(['--unknown']).status,2);assert.equal(run(['--help']).status,0);});

test('CLI honors language/device selection and rejects mismatches',()=>{
 const classic=run(['examples/hello.ino','--target','1.0','--device','flipper-zero']);assert.equal(classic.status,0,classic.stderr);assert.match(classic.stdout,/DuckyScript 1\.0/);assert.doesNotMatch(classic.stdout,/ATTACKMODE/);
 const croc=run(['examples/hello.ino','--target','2.0','--device','key-croc']);assert.equal(croc.status,0,croc.stderr);assert.match(croc.stdout,/QUACK STRING/);
 const mismatch=run(['examples/hello.ino','--target','3.0','--device','flipper-zero']);assert.equal(mismatch.status,1);assert.equal(mismatch.stdout,'');
});
test('CLI rejects colliding script/report paths without creating a misleading artifact',()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'inoquill-collision-'));const out=path.join(dir,'result.txt');
 try {
  const result=run(['examples/hello.ino','--out',out,'--report',path.join(dir,'.','result.txt')]);
  assert.equal(result.status,2);assert.match(result.stderr,/different output paths/);
  assert.throws(()=>readFileSync(out),{code:'ENOENT'});
 } finally {rmSync(dir,{recursive:true,force:true});}
});
