import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
test('wiki renderer preserves heading hierarchy, table header scopes and code as text',async()=>{
 const source=await readFile('dist/wiki.mjs','utf8');
 const element=tag=>({tag,children:[],append(...nodes){this.children.push(...nodes);},replaceChildren(...nodes){this.children=nodes;}});
 const context={document:{createElement:element}};
 vm.runInNewContext(source.replace("export { wikiPages } from './wiki-data.mjs';",'').replace('export function renderWiki','function renderWiki'),context);
 const root=element('article');context.renderWiki(root,{id:'Home',title:'Guide',summary:'Help',blocks:[{type:'h2',text:'Section'},{type:'code',text:'<script>plain text</script>'},{type:'table',headers:['Command','Meaning'],rows:[['ENTER','Enter key']]}]});
 assert.equal(root.children[1].tag,'h2');assert.equal(root.children[3].tag,'h3');
 assert.equal(root.children[4].children[0].textContent,'<script>plain text</script>');
 const headers=root.children[5].children[0].children[0].children[0].children;
 assert.ok(headers.every(node=>node.scope==='col'));
});
test('static fallback and source trace expose useful accessible structure',async()=>{
 const html=await readFile('dist/index.html','utf8');
 assert.match(html,/<noscript>[\s\S]*JavaScript is required[\s\S]*<\/noscript>/);
 assert.match(html,/<caption class="sr-only">Generated instructions/);
 assert.equal([...html.matchAll(/<th scope="col">/g)].length,3);
 assert.match(html,/id="main" tabindex="-1"/);
 assert.match(html,/id="wiki-search-status"[^>]*role="status"/);
});
