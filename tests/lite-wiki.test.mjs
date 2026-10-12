import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCachedLoader } from '../dist/workbench-utils.mjs';
import { wikiPages } from '../dist/wiki-data.mjs';
test('optional wiki loader shares concurrent requests and retries failures',async()=>{
 let count=0;const module={pages:[]};const load=createCachedLoader(async()=>{count++;if(count===1)throw Error('Temporary failure');return module;});
 const first=load(),same=load();assert.equal(first,same);await assert.rejects(first,/Temporary failure/);
 assert.equal(await load(),module);assert.equal(await load(),module);assert.equal(count,2);
});
test('user wiki has ten linked user guides and loads on demand',async()=>{
 assert.equal(wikiPages.length,10);
 const topics=['Home','Getting-Started','Output-Targets','Compatibility','Keys','Text','Control-Flow','Diagnostics','Disclaimer','References'];
 assert.deepEqual(wikiPages.map(page=>page.id).sort(),topics.sort());
 assert.equal(wikiPages.find(page=>page.id==='Disclaimer').title,'Use disclaimer');
 for(const page of wikiPages)for(const block of page.blocks)if(block.type==='links')for(const link of block.items)if(link.href.startsWith('#wiki/'))assert.ok(topics.includes(link.href.slice(6)));
 const renderer=await readFile('dist/wiki.mjs','utf8');assert.doesNotMatch(renderer,/Download this guide|wiki-download|\.download/);
 const app=await readFile('dist/app.mjs','utf8');assert.doesNotMatch(app,/^import .*from '\.\/wiki\.mjs'/m);assert.match(app,/await import\('\.\/wiki\.mjs'\)/);
});
test('leaving Wiki while its assets load cannot replace the current view or steal focus',async()=>{
 const {default:vm}=await import('node:vm');const source=await readFile('dist/app.mjs','utf8');let resolve;
 const pending=new Promise(done=>resolve=done);
 const heading={setAttribute(){},focus(){this.focused=true;}};
 const article={setAttribute(name,value){this[name]=value;}};
 const nodes={workspace:{id:'workspace'},wiki:{id:'wiki'},project:{id:'project',querySelector:()=>heading},'wiki-article':article};
 const context={routeRevision:0,$:id=>nodes[id],location:{hash:'#wiki/Text'},document:{querySelectorAll:selector=>selector==='.view'?[nodes.workspace,nodes.wiki,nodes.project]:[]},loadWiki:()=>pending};
 vm.runInNewContext(source.slice(source.indexOf('async function route(event)'),source.indexOf("window.addEventListener('hashchange'")),context);
 const loading=context.route({type:'hashchange'});context.location.hash='#project';await context.route({type:'hashchange'});
 resolve({wikiPages:[{id:'Text'}],renderWiki(){throw Error('Stale route must not render');}});await loading;
 assert.equal(nodes.project.hidden,false);assert.equal(nodes.wiki.hidden,true);assert.equal(article['aria-busy'],'false');assert.equal(heading.focused,true);
});
