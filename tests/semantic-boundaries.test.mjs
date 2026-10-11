import test from 'node:test';
import assert from 'node:assert/strict';
import {convert} from '../dist/converter.mjs';
const setup=body=>'void setup(){\n'+body+'\n}';
const cases=[
 ['pointer increment','char text[]="ABC";char *p=text;p++;Keyboard.println(p);',null],
 ['empty text condition','char text[]="";if(text){Keyboard.print("YES");}else{Keyboard.print("NO");}',null],
 ['GPIO side effect','int x=0;digitalWrite(1,++x);Keyboard.println(x);',null],
 ['continued comment','// continued '+String.fromCharCode(92)+'\nKeyboard.print("A");\nKeyboard.println("B");',['STRING B']]
];
for(const target of ['1.0','2.0','3.0'])for(const[name,body,want]of cases)test(target+': '+name,()=>{
 const r=convert(setup(body),{target,loop:'setup',comments:false});
 if(want===null){assert.equal(r.ok,false,r.script);assert.equal(r.script,'');assert.ok(r.diagnostics.some(d=>d.severity==='error'));}
 else{assert.equal(r.ok,true,JSON.stringify(r.diagnostics));assert.deepEqual(r.script.split('\n').filter(s=>s.startsWith('STRING ')),want);}
});

test('text conditions fail explicitly in every control-flow form',()=>{
 for(const body of ['if(""){Keyboard.print("A");}','while("x"){break;}','while("");','for(int i=0;"";i++){break;}']){
  const r=convert(setup(body));assert.equal(r.ok,false,body);assert.equal(r.script,'');assert.match(r.diagnostics[0].message,/Conditions must/);
 }
});
test('text updates cannot leak JavaScript coercion into C++ output',()=>{
 for(const body of ['String s="ABC";s++;','String s="ABC";s--;','char a[]="ABC";a="XYZ";','char a[]="ABC";char *p=a;p+=1;'])assert.equal(convert(setup(body)).ok,false,body);
 const r=convert(setup('String s="ABC";s="XYZ";Keyboard.print(s);'));assert.equal(r.ok,true);assert.match(r.script,/STRING XYZ/);
});
test('GPIO arguments must be provably side-effect-free before omission',()=>{
 for(const name of ['pinMode','digitalWrite'])for(const args of ['1,x++','++x,1','1,helper()','1,(x=2)','1,"HIGH"']){
  const r=convert(setup('int x=0;'+name+'('+args+');Keyboard.print(x);'));assert.equal(r.ok,false,args);assert.equal(r.script,'');
 }
 const r=convert(setup('int x=0;x++;digitalWrite(1,x);Keyboard.print(x);'));assert.equal(r.ok,true);assert.match(r.script,/STRING 1/);assert.ok(r.diagnostics.some(d=>d.message.includes('omitted')));
});
test('line splicing handles comments, literals, identifiers, macros and physical source lines',()=>{
 const slash=String.fromCharCode(92);
 for(const nl of ['\n','\r\n','\r']){
 const code=['#define N (1 + '+slash,'2)','void setup(){','// continued '+slash,'Keyboard.print("hidden");','Keyboard.pr'+slash,'int("A'+slash,'B");','Keyboard.println(N);','}'].join(nl);
 const r=convert(code,{loop:'setup',comments:false});assert.equal(r.ok,true,JSON.stringify(r.diagnostics));assert.deepEqual(r.script.split('\n').filter(x=>x.startsWith('STRING ')),['STRING AB','STRING 3']);
 assert.equal(r.sourceMap.find(x=>r.script.split('\n')[x.outputLine-1]==='STRING AB').sourceLine,6);
 assert.equal(r.sourceMap.find(x=>r.script.split('\n')[x.outputLine-1]==='STRING 3').sourceLine,9);
 }
});
test('compiler-specific whitespace after a continuation is rejected explicitly',()=>{
 const r=convert(setup('// comment '+String.fromCharCode(92)+' \nKeyboard.print("A");'));
 assert.equal(r.ok,false);assert.match(r.diagnostics[0].message,/compiler-specific/);assert.equal(r.diagnostics[0].line,2);
});
test('deterministic malformed-input corpus remains bounded and never exports failed output',()=>{
 let seed=987654321;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
 const tokens=['(',')','{','}',';','int','char','if','for','while','break','return','#define A','"x"',"'A'",'x','0','1','++','+=','&&','<<','DigiKeyboard.print'];
 for(let i=0;i<1000;i++){
 const source=Array.from({length:10+random()%90},()=>tokens[random()%tokens.length]).join(' '),r=convert(source);
 assert.equal(r.ok,false,'Generated case '+i);assert.equal(r.script,'');assert.ok(r.diagnostics.some(d=>d.severity==='error'));
 }
});
