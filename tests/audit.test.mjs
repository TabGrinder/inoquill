import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import {mkdtemp,mkdir,writeFile,symlink,truncate,readFile} from 'node:fs/promises';
import {createAppServer} from '../server.mjs';
import {convert} from '../dist/converter.mjs';
const raw = (port,path,headers={},method='GET') => new Promise((resolve,reject)=>{const req=http.request({hostname:'127.0.0.1',port,path,method,headers},res=>{let body='';res.on('data',chunk=>body+=chunk);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}));});req.on('error',reject);req.end();});
test('audit: hidden aliases, hostile hosts, cross-site requests and oversized files are denied',async()=>{
 const root=await mkdtemp('/tmp/inoquill-audit-');await writeFile(root+'/index.html','PUBLIC');await writeFile(root+'/.private.md','PRIVATE-CANARY');await symlink(root+'/.private.md',root+'/alias.md');await mkdir(root+'/.config');await writeFile(root+'/.config/key.md','PRIVATE-CANARY');await symlink(root+'/.config/key.md',root+'/nested.md');await writeFile(root+'/large.zip','');await truncate(root+'/large.zip',5*1024*1024+1);
 const server=createAppServer(root);server.listen(0,'127.0.0.1');await once(server,'listening');const port=server.address().port;
 try{
  for(const path of ['/alias.md','/nested.md','/.private.md','/%2eprivate.md','/%00.md','/%5cprivate.md']){const r=await raw(port,path);assert.equal(r.status,403,path);assert.ok(!r.body.includes('PRIVATE-CANARY'));}
  assert.equal((await raw(port,'/',{Host:'foreign.invalid'})).status,403);
  assert.equal((await raw(port,'/',{'Sec-Fetch-Site':'cross-site'})).status,403);
  assert.equal((await raw(port,'/large.zip')).status,413);
  assert.equal((await raw(port,'/%ZZ')).status,400);
  for(const path of ['/..%2f.private.md','/%252eprivate.md','/missing.js','/index.html/extra']){const r=await raw(port,path);assert.ok(r.status>=400,path);assert.ok(!r.body.includes('PRIVATE-CANARY'));}
  for(const method of ['POST','PUT','DELETE','OPTIONS'])assert.equal((await raw(port,'/',{},method)).status,405);
  const head=await raw(port,'/',{},'HEAD');assert.equal(head.status,200);assert.equal(head.body,'');assert.equal(head.headers['content-length'],'6');
  assert.equal((await raw(port,'/')).body,'PUBLIC');assert.equal(server.headersTimeout,5000);assert.equal(server.requestTimeout,10000);assert.equal(server.maxRequestsPerSocket,100);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
test('audit: adversarial source text remains bounded across every output profile',()=>{
 const corpus=['<script>alert(1)</script>','void setup(){Keyboard.print("<img src=x onerror=alert(1)>");}','void setup(){while(true){}}','void setup(){delay(4294967295);}','#include "../../private"\nvoid setup(){unknown();}','void setup(){Keyboard.print("$example");}','void setup(){Keyboard.print("\\x00");}'];
 for(const target of ['1.0','2.0','3.0'])for(const source of corpus){const r=convert(source,{target});assert.equal(typeof r.ok,'boolean');assert.ok(r.sourceMap.length<=10000);if(!r.ok)assert.equal(r.script,'');}
});
test('audit: untrusted content has no HTML execution sink or sketch evaluation',async()=>{
 for(const file of ['dist/app.mjs','dist/wiki.mjs'])assert.doesNotMatch(await readFile(file,'utf8'),/innerHTML|outerHTML|insertAdjacentHTML|document\.write\(/);
 assert.doesNotMatch(await readFile('dist/converter.mjs','utf8'),/\beval\s*\(|new\s+Function\s*\(/);
});
