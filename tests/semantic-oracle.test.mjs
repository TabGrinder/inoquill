import {
  test
} from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  writeFileSync,
  rmSync
} from 'node:fs';
import {
  tmpdir
} from 'node:os';
import {
  join
} from 'node:path';
import {
  execFileSync
} from 'node:child_process';
import {
  convert
} from '../dist/converter.mjs';
// Only ABI-independent cases: fixed 32-bit operands, ASCII, small ints and macros.
// This is a language oracle, not a USB emulator or an Arduino hardware test.
const cases = [
  ['uint32_t x=4294967295;', 'x >> 1'],
  ['uint32_t x=2147483648;', 'x >> 31'],
  ['uint32_t x=4294967295;', 'x & 255'],
  ['uint32_t x=0;', '~x'],
  ['uint32_t x=1;', 'x << 31'],
  ['uint32_t x=4294967295;', 'x + 1'],
  ['uint32_t x=0;', 'x - 1'],
  ['uint32_t x=4000000000; uint32_t y=3;', 'x * y'],
  ['uint32_t x=4000000000; uint32_t y=3;', 'x / y'],
  ['uint32_t x=4000000000; uint32_t y=3;', 'x % y'],
  ['uint32_t x=1;', '-1 < x'],
  ['uint32_t x=4294967295;', '-1 == x'],
  ["char c='A';", '((c))'],
  ["char c='A';", '+c'],
  ['', "('B')"],
  ['', '1 + 2 * 3'],
  ['', '(1 + 2) * 3'],
  ['', '-7 / 3'],
  ['', '-7 % 3'],
  ['', 'MACRO * 3'],
  ['', 'GROUPED * 3'],
  ['', 'FORWARD * 3'],
  ['', 'ALIAS'],
  ['', '(3 < 4) && (9 != 2)'],
  ['', '0x7fff & 0x55'],
];
for (let i = 0; i < 32; i++) cases.push(['uint32_t x=305419896;', 'x >> ' + i]);
// Deterministic generated arithmetic cases, compiled by the independent oracle.
let seed = 0x13579bdf;
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed; };
const operations = ['+', '-', '*', '/', '%', '&', '|', '^', '<', '>', '==', '!='];
for (let i = 0; i < 256; i++) {
  const x = random(), y = random() || 1;
  const expression = i % 4 === 0 ? '(x >> ' + (i % 32) + ')' : 'x ' + operations[i % operations.length] + ' y';
  cases.push(['uint32_t x=' + x + ';uint32_t y=' + y + ';', expression]);
}
test('independent C++ compiler agrees on 313 expressions for every target', () => {
  const dir = mkdtempSync(join(tmpdir(), 'inoquill-oracle-'));
  try {
    const macros = '#define MACRO 1 + 2\n#define GROUPED (1 + 2)\n#define FORWARD MACRO\n#define ALIAS LATER\n#define LATER 42\n';
    const cpp = '#include <iostream>\n#include <cstdint>\n' + macros + 'int main(){\n' + cases.map(([decl, expr]) => '{' + decl + ' std::cout << (' + expr + ') << "\\n";}').join('\n') + '\n}';
    writeFileSync(join(dir, 'oracle.cpp'), cpp);
    execFileSync('g++', ['-std=c++17', '-Wall', '-Wextra', join(dir, 'oracle.cpp'), '-o', join(dir, 'oracle')], {
      stdio: 'pipe',
      timeout: 20000
    });
    const expected = execFileSync(join(dir, 'oracle'), {
      encoding: 'utf8',
      timeout: 5000
    }).trimEnd().split('\n');
    for (const target of ['1.0', '2.0', '3.0']) cases.forEach(([decl, expr], i) => {
      const r = convert(macros + 'void setup(){' + decl + 'Keyboard.println(' + expr + ');}', {
        target,
        loop: 'setup',
        comments: false
      });
      assert.equal(r.ok, true, expr + ': ' + JSON.stringify(r.diagnostics));
      assert.deepEqual(r.script.split('\n').filter(s => s.startsWith('STRING ')), ['STRING ' + expected[i]], target + ': ' + expr);
    });
  } finally {
    rmSync(dir, {
      recursive: true,
      force: true
    });
  }
});
test('independent C++ reference confirms the four second-review boundaries',()=>{
 const dir=mkdtempSync(join(tmpdir(),'inoquill-boundaries-'));
 const slash=String.fromCharCode(92);
 const cases=[
  ['char text[]="ABC";char *p=text;p++;','p','BC'],
  ['char text[]="";','text ? "YES" : "NO"','YES'],
  ['int x=0;digitalWrite(1,++x);','x','1'],
 ];
 try {
  const cpp='#include <iostream>\nvoid digitalWrite(int,int){}\nint main(){\n'+cases.map(([decl,expr])=>'{'+decl+'std::cout<<('+expr+')<<"\\n";}').join('\n')+'\n// continued '+slash+'\nstd::cout<<"A";\nstd::cout<<"B\\n";\n}';
  writeFileSync(join(dir,'reference.cpp'),cpp);
  execFileSync('g++',['-std=c++17',join(dir,'reference.cpp'),'-o',join(dir,'reference')],{stdio:'pipe',timeout:20000});
  assert.deepEqual(execFileSync(join(dir,'reference'),{encoding:'utf8',timeout:5000}).trimEnd().split('\n'),['BC','YES','1','B']);
 } finally {rmSync(dir,{recursive:true,force:true});}
});
