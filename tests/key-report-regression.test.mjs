import test from 'node:test';
import assert from 'node:assert/strict';
import {convert} from '../dist/converter.mjs';
const run=(body,target='3.0')=>convert('void setup(){'+body+'}',{target,loop:'setup',comments:false});
const actions=r=>r.script.split('\n').filter(s=>s && !s.startsWith('REM ') && s!=='ATTACKMODE HID');
for(const target of ['1.0','2.0','3.0']){
 test(target+': repeated DigiKeyboard report does not retrigger a key',()=>{
  const r=run('DigiKeyboard.sendKeyPress(KEY_A);DigiKeyboard.sendKeyPress(KEY_A);DigiKeyboard.sendKeyPress(0);',target);
  assert.equal(r.ok,true,JSON.stringify(r.diagnostics));
  assert.deepEqual(actions(r),target==='3.0'?['HOLD a','RELEASE a']:['STRING a']);
 });
 test(target+': numeric-looking text cannot become a key code',()=>{
  for(const call of ['Keyboard.write("176")','Keyboard.press("128")','Keyboard.release("128")','DigiKeyboard.sendKeyStroke("4")','DigiKeyboard.sendKeyPress("4")']){
   const r=run(call+';',target);assert.equal(r.ok,false,call);assert.equal(r.script,'');
  }
 });
}
test('stroke of an already-held DigiKeyboard key releases without a second press',()=>{
 const r=run('DigiKeyboard.sendKeyPress(KEY_A);DigiKeyboard.sendKeyStroke(KEY_A);');
 assert.equal(r.ok,true);assert.deepEqual(actions(r),['HOLD a','RELEASE a']);
});
test('changing a DigiKeyboard modifier preserves the held ordinary key',()=>{
 const r=run('DigiKeyboard.sendKeyPress(KEY_A);DigiKeyboard.sendKeyPress(KEY_A,MOD_SHIFT_LEFT);DigiKeyboard.sendKeyPress(0);');
 assert.equal(r.ok,true);assert.deepEqual(actions(r),['HOLD a','INJECT_MOD','HOLD SHIFT','INJECT_MOD','RELEASE SHIFT','RELEASE a']);
});
test('changing DigiKeyboard key preserves its common modifier',()=>{
 const r=run('DigiKeyboard.sendKeyPress(KEY_A,MOD_SHIFT_LEFT);DigiKeyboard.sendKeyPress(KEY_B,MOD_SHIFT_LEFT);DigiKeyboard.sendKeyPress(0);');
 assert.equal(r.ok,true);assert.deepEqual(actions(r),['INJECT_MOD','HOLD SHIFT','HOLD a','RELEASE a','HOLD b','RELEASE b','INJECT_MOD','RELEASE SHIFT']);
});

test('1200 report transitions agree with an independent HID report-state model',()=>{
 let seed=0x19aef17;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
 const modifiers=['CTRL','SHIFT','ALT','GUI'];
 for(let sample=0;sample<100;sample++){
  let body='',previous=new Set();const expected=[];
  for(let step=0;step<12;step++){
   const code=step===11?0:random()%4;
   const mask=step===11?0:(random()>>>16)%16;
   const next=new Set(modifiers.filter((_,bit)=>mask&(1<<bit)));
   if(code)next.add(String.fromCharCode(96+code));
   expected.push([...previous].filter(k=>!next.has(k)).map(k=>'RELEASE '+k).concat([...next].filter(k=>!previous.has(k)).map(k=>'HOLD '+k)).sort());
   body+='DigiKeyboard.sendKeyPress('+(code?code+3:0)+','+mask+');delay(20);';previous=next;
  }
  const result=run(body);assert.equal(result.ok,true,JSON.stringify(result.diagnostics));
  const actual=[];let transition=[];
  for(const action of actions(result)){
   if(action==='DELAY 20'){actual.push(transition.sort());transition=[];}
   else if(action.startsWith('HOLD ')||action.startsWith('RELEASE '))transition.push(action);
  }
  assert.deepEqual(actual,expected,'report sequence '+sample);assert.deepEqual(transition,[]);
 }
});
