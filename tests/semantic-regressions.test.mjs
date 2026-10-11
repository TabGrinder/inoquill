import {
  test
} from 'node:test';
import assert from 'node:assert/strict';
import {
  convert
} from '../dist/converter.mjs';
const script = (code, target = '3.0') => convert(code, {
  target,
  loop: 'setup',
  comments: false
});
const setup = body => 'void setup(){' + body + '} void loop(){}';
for (const target of ['1.0', '2.0', '3.0']) {
  for (const [name, code, want] of [
      ['unsigned shift', setup('uint32_t n=4294967295;Keyboard.println(n>>1);'), 'STRING 2147483647'],
      ['parenthesized char', setup("char c='A';Keyboard.println(((c)));"), 'STRING A'],
      ['textual macro precedence', '#define A 1 + 2\n' + setup('Keyboard.println(A*3);'), 'STRING 7'],
      ['explicit key value', '#define KEY_DOWN 0x52\n' + setup('DigiKeyboard.sendKeyStroke(KEY_DOWN);'), 'UPARROW']
    ]) test(`${target}: ${name}`, () => {
    const r = script(code, target);
    assert.equal(r.ok, true, JSON.stringify(r.diagnostics));
    assert.ok(r.script.split('\n').includes(want), r.script);
  });
}

test('AVR promotions, suffixes and expression overflow are explicit', () => {
  for (const [body, want] of [
      ['Keyboard.println(65535U >> 1);', 'STRING 32767'],
      ['Keyboard.println(~0U);', 'STRING 65535'],
      ['Keyboard.println(1UL << 31);', 'STRING 2147483648'],
      ['byte x=255;Keyboard.println(x+1);', 'STRING 256'],
      ["char c='A';Keyboard.println(+c);", 'STRING 65'],
      ['uint32_t x=0;x=4294967295;Keyboard.println(x>>1);', 'STRING 2147483647'],
    ]) {
    const r = script(setup(body));
    assert.equal(r.ok, true, JSON.stringify(r.diagnostics));
    assert.ok(r.script.includes(want), r.script);
  }
  for (const body of ['Keyboard.println(300*300);', 'Keyboard.println(1<<16);', 'Keyboard.println(1UU);', 'Keyboard.println(0xGG);', 'Keyboard.println(-1>>1);']) assert.equal(script(setup(body)).ok, false, body);
});
test('macro aliases, forward references and source lines are preserved', () => {
  const r = script('#define A B\n#define B (2+3)\nvoid setup(){\nKeyboard.println(A*2);\n}');
  assert.equal(r.ok, true, JSON.stringify(r.diagnostics));
  assert.match(r.script, /STRING 10/);
  assert.equal(r.sourceMap.find(m => r.script.split('\n')[m.outputLine - 1] === 'STRING 10').sourceLine, 4);
  for (const code of ['#define A A\n', '#define A B\n#define B A\n']) assert.equal(script(code + setup('Keyboard.print(A);')).ok, false);
});
test('hex escapes consume all hex digits and reject unsupported code points', () => {
  assert.equal(script(setup('Keyboard.print("\\x4142");')).ok, false);
  assert.match(script(setup('Keyboard.print("\\x41" "42");')).script, /STRING A42/);
});
test('declared key values and parenthesized numeric aliases take priority', () => {
  for (const expr of ['KEY_DOWN', '(KEY_DOWN)', 'ALIAS']) {
    const r = script('#define KEY_DOWN (0x52)\n#define ALIAS KEY_DOWN\n' + setup('DigiKeyboard.sendKeyStroke(' + expr + ');'));
    assert.equal(r.ok, true, JSON.stringify(r.diagnostics));
    assert.match(r.script, /UPARROW/);
  }
  const r = script(setup('const int KEY_DOWN=0x52;DigiKeyboard.sendKeyStroke(KEY_DOWN);'));
  assert.match(r.script, /UPARROW/);
});
test('block exit does not roll back global changes mentioned in local initializers', () => {
  const r = convert('int x=1;void setup(){x=2;int y=x;}void loop(){Keyboard.println(x);}', {
    comments: false
  });
  assert.equal(r.ok, true, JSON.stringify(r.diagnostics));
  assert.match(r.script, /STRING 2/);
});
test('helper parameter and copied scope retain unsigned and char types', () => {
  const r = script('void helper(uint32_t n,char c){Keyboard.println(n>>1);Keyboard.println((c));}void setup(){helper(4294967295,65);}');
  assert.equal(r.ok, true, JSON.stringify(r.diagnostics));
  assert.match(r.script, /STRING 2147483647\nENTER\nSTRING A/);
});
test('Keyboard.end does not release held keys; rollover is rejected', () => {
  assert.equal(script(setup('Keyboard.press(KEY_LEFT_CTRL);Keyboard.end();Keyboard.print("A");')).ok, false);
  assert.equal(script(setup("Keyboard.press('a');Keyboard.press('b');Keyboard.press('c');Keyboard.press('d');Keyboard.press('e');Keyboard.press('f');Keyboard.press('g');")).ok, false);
});
test('string assignments cannot silently become numbers and invalid array types fail', () => {
  for (const body of ['String s="A";s=65;Keyboard.print(s);', 'int a[]="A";Keyboard.print(a);', 'unsigned unsigned int x=1;']) assert.equal(script(setup(body)).ok, false, body);
});
test('unbraced control-flow declarations cannot leak, and break has no operand', () => {
  for (const body of ['if(true) int x=1;Keyboard.println(x);', 'for(int i=0;i<1;i++) int x=1;Keyboard.println(x);', 'while(true){break 1;}']) assert.equal(script(setup(body)).ok, false, body);
  assert.equal(script(setup('for(int i=0;i<3;i++) int x=1;Keyboard.println("done");')).ok, true);
});
test('Keyboard string writes omit carriage returns as the source library does', () => {
  const r = script(setup('Keyboard.print("A\\rB\\r\\nC");'));
  assert.equal(r.ok, true);
  assert.match(r.script, /STRING AB\nENTER\nSTRING C/);
});
test('ASCII carriage return cannot silently become a Keyboard Enter key',()=>{
 for(const body of ["Keyboard.write('\\r');",'Keyboard.write(13);',"Keyboard.print('\\r');"]){const r=script(setup(body));assert.equal(r.ok,false,body);assert.equal(r.script,'');}
});
