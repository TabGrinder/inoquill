import test from 'node:test';
import assert from 'node:assert/strict';
import { convert, VERSION } from '../dist/converter.mjs';
import { targets } from '../dist/targets.mjs';
const setup = body => 'void setup(){' + body + '}void loop(){}';
const waits = script => [...script.matchAll(/^(?:QUACK )?DELAY (\d+)$/gm)].map(m => Number(m[1]));
test('the initial public release stays at 1.0.0', () => assert.equal(VERSION, '1.0.0'));
test('all three profiles preserve a benign DigiKeyboard sequence', () => {
  for (const target of ['1.0', '2.0', '3.0']) {
    const r = convert(setup('DigiKeyboard.sendKeyStroke(0);DigiKeyboard.delay(2000);DigiKeyboard.println("Hello!");'), { target });
    assert.equal(r.ok, true, JSON.stringify(r.diagnostics));
    assert.match(r.script, new RegExp('DuckyScript ' + target.replace('.', '\\.')));
    assert.match(r.script, /DELAY 2000\nSTRING Hello!\nENTER/);
    assert.equal(r.script.includes('ATTACKMODE HID'), target === '3.0');
    assert.deepEqual(r.sourceMap.map(m=>m.outputLine), Array.from({length:r.sourceMap.length},(_,i)=>i+1));
  }
});
test('long waits reproduce the screenshot failure class without blocking', () => {
  for (const target of ['1.0','2.0','3.0']) for (const duration of [65535,65536,65554,65555,120000,131071,10000,10001]) {
    const r = convert(setup('pinMode(1,OUTPUT);DigiKeyboard.update();digitalWrite(1,HIGH);DigiKeyboard.delay('+duration+');'), {target});
    assert.equal(r.ok,true,JSON.stringify(r.diagnostics)); const chunks=waits(r.script);
    assert.equal(chunks.reduce((a,b)=>a+b,0),duration); assert.equal(r.stats.delayMs,duration);
    assert.ok(chunks.every(n=>n>=(target==='3.0'?20:1)&&n<=(target==='2.0'?10000:65535)));
    for(const map of r.sourceMap) assert.equal(map.sourceLine,1);
  }
});
test('long startup delays use the same splitting rules',()=>{
 for(const target of ['1.0','2.0','3.0']) { const r=convert(setup('DigiKeyboard.print("Hi");'),{target,initialDelay:120000});assert.equal(r.ok,true);assert.equal(waits(r.script).reduce((a,b)=>a+b,0),120000); }
});
test('profile minima, invalid waits and expansion budget are explicit',()=>{
 assert.equal(convert(setup('delay(10);'),{target:'1.0'}).ok,true);
 assert.equal(convert(setup('delay(10);'),{target:'2.0'}).ok,true);
 assert.equal(convert(setup('delay(10);'),{target:'3.0'}).ok,false);
 for(const body of ['delay(-1);','delay(4294967296);','delay(4294967295);'])assert.equal(convert(setup(body)).ok,false);
 for(const target of ['1.0','2.0','3.0'])assert.equal(convert(setup('delay(0);'),{target}).stats.delayMs,0);
});
test('portable targets lower immediate presses and leave 3.0 holds intact',()=>{
 const code=setup("Keyboard.press(KEY_LEFT_CTRL);Keyboard.press('a');Keyboard.releaseAll();Keyboard.write(KEY_RETURN);");
 for(const target of ['1.0','2.0']){const r=convert(code,{target});assert.equal(r.ok,true,JSON.stringify(r.diagnostics));assert.match(r.script,/CTRL a\nENTER/);assert.doesNotMatch(r.script,/HOLD|RELEASE|INJECT_MOD|ATTACKMODE/);assert.ok(r.diagnostics.some(d=>d.message.includes('portable')));}
 assert.match(convert(code).script,/HOLD CTRL/);
});
test('portable targets reject timed holds, standalone modifiers and repetition',()=>{
 for(const target of ['1.0','2.0'])for(const body of ["Keyboard.press('a');delay(100);Keyboard.releaseAll();",'DigiKeyboard.sendKeyStroke(0,MOD_GUI_LEFT);',"Keyboard.press('a');Keyboard.press('b');Keyboard.releaseAll();"]){const r=convert(setup(body),{target});assert.equal(r.ok,false);assert.equal(r.script,'');}
 for(const target of ['1.0','2.0'])assert.equal(convert(setup('Keyboard.print("Hi");'),{target,loop:'repeat'}).ok,false);
});
test('device presets must agree with the language and all presets are usable',()=>{
 for(const device of targets){const r=convert(setup('DigiKeyboard.println("Hello");'),{device:device.id,target:device.language||'1.0'});assert.equal(r.ok,true,device.id);assert.equal(r.options.device,device.id);}
 assert.equal(convert(setup(''),{device:'flipper-zero',target:'3.0'}).ok,false);
 assert.equal(convert(setup(''),{device:'invented'}).ok,false);
 assert.equal(convert(setup(''),{target:'4.0'}).ok,false);
});
test('Key Croc snippet quotes shell characters and retains traceability',()=>{
 const r=convert(setup('DigiKeyboard.print("It\'s `quoted` & safe");delay(12000);'),{target:'2.0',device:'key-croc'});
 assert.equal(r.ok,true,JSON.stringify(r.diagnostics));assert.ok(r.script.includes("QUACK STRING 'It'\"'\"'s `quoted` & safe'"));assert.match(r.script,/QUACK DELAY 10000\nQUACK DELAY 2000/);assert.doesNotMatch(r.script,/^REM /m);assert.equal(r.sourceMap.length,r.script.trimEnd().split('\n').length);assert.equal(r.stats.commands,3);
});
