import {
  targets
} from './targets.mjs';
// InoQuill: bounded, non-executing parser for a documented Arduino subset.
export const VERSION = '1.0.0';
import {
  ConversionError
} from './conversion-error.mjs';
export {
  ConversionError
}
from './conversion-error.mjs';
import {
  evaluate,
  evaluateTyped,
  expressionTypes,
  declarationType
} from './expressions.mjs';
export function tokenize(source) {
  if (typeof source !== 'string') throw new ConversionError('Source must be a string.');
  let nesting = 0;
  const tokens = [];
  let i = 0,
    line = 1;
  const push = (v, type = 'symbol', at = line) => {
    if (type === 'symbol') {
      if (['{', '(', '['].includes(v) && ++nesting > 64) throw new ConversionError('Maximum syntax nesting: 64.', at);
      if (['}', ')', ']'].includes(v)) nesting--;
    }
    if (tokens.length >= 50000) throw new ConversionError('Maximum token count: 50,000.', at);
    tokens.push({
      v,
      type,
      line: at
    });
  };
  while (i < source.length) {
    let c = source[i];
    if (/\s/.test(c)) {
      if (c === '\n') line++;
      i++;
      continue;
    }
    if (source.startsWith('//', i)) {
      while (i < source.length && source[i] !== '\n') i++;
      continue;
    }
    if (source.startsWith('/*', i)) {
      let at = line;
      i += 2;
      while (i < source.length && !source.startsWith('*/', i)) {
        if (source[i++] === '\n') line++;
      }
      if (i === source.length) throw new ConversionError('Unterminated comment.', at);
      i += 2;
      continue;
    }
    if (c === '#') {
      const start = i,
        at = line;
      while (i < source.length && source[i] !== '\n') i++;
      push(source.slice(start, i), 'directive', at);
      continue;
    }
    if (c === '"' || c === "'") {
      const quote = c,
        at = line;
      let value = '';
      i++;
      while (i < source.length && source[i] !== quote) {
        c = source[i++];
        if (c === '\n') throw new ConversionError('Unterminated literal.', at);
        if (c === '\\') {
          let e = source[i++];
          const map = {
            n: '\n',
            r: '\r',
            t: '\t',
            b: '\b',
            '\\': '\\',
            '"': '"',
            "'": "'",
            '0': '\0'
          };
          if (e in map) value += map[e];
          else if (e === 'x') {
            let h = source.slice(i).match(/^[0-9a-fA-F]+/);
            if (!h) throw new ConversionError('Invalid hexadecimal escape.', at);
            if (BigInt('0x' + h[0]) > 127n) throw new ConversionError('Hexadecimal escape exceeds supported ASCII.', at);
            value += String.fromCharCode(parseInt(h[0], 16));
            i += h[0].length;
          } else throw new ConversionError('Unsupported escape: \\' + e, at);
        } else value += c;
      }
      if (source[i] !== quote) throw new ConversionError('Unterminated literal.', at);
      i++;
      if (quote === "'" && value.length !== 1) throw new ConversionError('Expected a single character.', at);
      push(value, quote === '"' ? 'string' : 'char', at);
      continue;
    }
    let m = source.slice(i).match(/^(?:0[xX][0-9a-fA-F]+|0[bB][01]+|\d+)(?:[uUlL]+)?/);
    if (m) {
      push(m[0], 'number');
      i += m[0].length;
      continue;
    }
    m = source.slice(i).match(/^[A-Za-z_][A-Za-z_0-9]*/);
    if (m) {
      push(m[0], 'id');
      i += m[0].length;
      continue;
    }
    const op = ['++', '--', '+=', '-=', '==', '!=', '<=', '>=', '&&', '||', '<<', '>>'].find(o => source.startsWith(o, i));
    if (op) {
      push(op);
      i += op.length;
    } else {
      push(c);
      i++;
    }
  }
  tokens.push({
    v: '<eof>',
    type: 'eof',
    line
  });
  return tokens;
}
// Object-like macros use token substitution, not eager arithmetic evaluation.
function preprocess(tokens) {
  const macros = new Map(),
    output = [];
  let budget = 0;

  function expand(t, seen = new Set()) {
    if (++budget > 100000) throw new ConversionError('Macro expansion budget exceeded.', t.line);
    if (t.type !== 'id' || !macros.has(t.v)) {
      if (output.length >= 50000) throw new ConversionError('Maximum expanded token count: 50,000.', t.line);
      output.push(t);
      return;
    }
    if (seen.has(t.v) || seen.size >= 32) throw new ConversionError('Recursive or excessively deep macro expansion: ' + t.v, t.line);
    const chain = new Set(seen);
    chain.add(t.v);
    for (const item of macros.get(t.v)) expand({
      ...item,
      line: t.line
    }, chain);
  }
  for (const t of tokens) {
    if (t.type !== 'directive') {
      expand(t);
      continue;
    }
    if (/^#\s*include\s*[<"].*[>"](?:\s|\/\/.*)*$/.test(t.v)) continue;
    const m = t.v.match(/^#\s*define\s+([A-Za-z_]\w*)(\s+)(.+)$/);
    if (!m) throw new ConversionError('Unsupported preprocessor directive: ' + t.v, t.line);
    if (macros.has(m[1])) throw new ConversionError('Duplicate macro: ' + m[1], t.line);
    const replacement = tokenize(m[3]).slice(0, -1);
    if (!replacement.length || replacement.some(x => x.type === 'directive')) throw new ConversionError('Unsupported macro replacement.', t.line);
    macros.set(m[1], replacement);
  }
  // Macro expansion must respect the same nesting limit as original source.
  let depth = 0;
  for (const t of output)
    if (t.type === 'symbol') {
      if (['(', '[', '{'].includes(t.v) && ++depth > 64) throw new ConversionError('Maximum expanded syntax nesting: 64.', t.line);
      if ([')', ']', '}'].includes(t.v)) depth--;
    }
  return output;
}
const v = t => t?.v;
const types = new Set(['const', 'static', 'unsigned', 'signed', 'long', 'int', 'byte', 'uint8_t', 'uint16_t', 'uint32_t', 'bool', 'char', 'String', 'void']);

function split(ts, delimiter = ',') {
  const parts = [
    []
  ];
  let depth = 0;
  for (const t of ts) {
    if (['(', '['].includes(t.v)) depth++;
    if ([')', ']'].includes(t.v)) depth--;
    if (t.v === delimiter && depth === 0) parts.push([]);
    else parts.at(-1).push(t);
  }
  return parts;
}
class Parser {
  constructor(ts) {
    this.ts = ts;
    this.i = 0;
    this.loopDepth = 0;
  }
  peek() {
    return this.ts[this.i];
  }
  take() {
    return this.ts[this.i++];
  }
  expect(x) {
    let t = this.take();
    if (t.v !== x) throw new ConversionError('Expected ' + x + '; received ' + t.v, t.line);
    return t;
  }
  group() {
    this.expect('(');
    let a = [],
      depth = 1;
    while (depth) {
      let t = this.take();
      if (!t || t.type === 'eof') throw new ConversionError('Unclosed parentheses.', t?.line);
      if (t.v === '(') depth++;
      if (t.v === ')') depth--;
      if (depth) a.push(t);
    }
    return a;
  }
  until(x) {
    let a = [],
      depth = 0;
    while (!(this.peek().v === x && depth === 0)) {
      let t = this.take();
      if (t.type === 'eof' || t.v === '}') throw new ConversionError('Missing ' + x, t.line);
      if (['(', '['].includes(t.v)) depth++;
      if ([')', ']'].includes(t.v)) depth--;
      a.push(t);
    }
    this.take();
    return a;
  }
  statement() {
    let t = this.peek(),
      line = t.line;
    if (t.v === '{') {
      this.take();
      let body = [];
      while (this.peek().v !== '}') {
        if (this.peek().type === 'eof') throw new ConversionError('Unclosed block.', line);
        body.push(this.statement());
      }
      this.take();
      return {
        kind: 'block',
        body,
        line
      };
    }
    if (['if', 'for', 'while'].includes(t.v)) {
      this.take();
      const expr = this.group();
      if (t.v !== 'if') this.loopDepth++;
      const body = this.statement();
      if (t.v !== 'if') this.loopDepth--;
      let alternate = null;
      if (t.v === 'if' && this.peek().v === 'else') {
        this.take();
        alternate = this.statement();
      }
      return {
        kind: t.v,
        expr,
        body,
        alternate,
        line
      };
    }
    if (t.v === 'return' || t.v === 'break') {
      if (t.v === 'break' && !this.loopDepth) throw new ConversionError('break is only valid inside a loop.', line);
      this.take();
      return {
        kind: t.v,
        expr: this.until(';'),
        line
      };
    }
    if (t.v === ';') {
      this.take();
      return {
        kind: 'empty',
        line
      };
    }
    if (t.type === 'directive') {
      this.take();
      return {
        kind: 'directive',
        token: t,
        line
      };
    }
    return {
      kind: 'simple',
      expr: this.until(';'),
      line
    };
  }
  program() {
    const functions = new Map(),
      globals = [];
    while (this.peek().type !== 'eof') {
      if (this.peek().type === 'directive') {
        globals.push(this.statement());
        continue;
      }
      let start = this.i,
        j = start;
      while (types.has(v(this.ts[j])) || v(this.ts[j]) === '*') j++;
      if (this.ts[j]?.type === 'id' && v(this.ts[j + 1]) === '(') {
        if (this.ts.slice(start, j).map(t => t.v).join('') !== 'void') throw new ConversionError('Only void functions are supported.', this.ts[start].line);
        this.i = j;
        const name = this.take().v,
          params = this.group();
        if (this.peek().v === ';') {
          this.take();
          continue;
        }
        if (functions.has(name)) throw new ConversionError('Duplicate or overloaded function: ' + name, this.ts[j].line);
        functions.set(name, {
          params,
          body: this.statement(),
          line: this.ts[j].line
        });
      } else globals.push(this.statement());
    }
    return {
      functions,
      globals
    };
  }
}
const named = {
  RETURN: 'ENTER',
  ENTER: 'ENTER',
  ESC: 'ESCAPE',
  ESCAPE: 'ESCAPE',
  BACKSPACE: 'BACKSPACE',
  TAB: 'TAB',
  SPACE: 'SPACE',
  CAPS_LOCK: 'CAPSLOCK',
  CAPSLOCK: 'CAPSLOCK',
  PRINT_SCREEN: 'PRINTSCREEN',
  PRINTSCREEN: 'PRINTSCREEN',
  SCROLL_LOCK: 'SCROLLLOCK',
  PAUSE: 'PAUSE',
  INSERT: 'INSERT',
  HOME: 'HOME',
  PAGE_UP: 'PAGEUP',
  DELETE: 'DELETE',
  END: 'END',
  PAGE_DOWN: 'PAGEDOWN',
  RIGHT_ARROW: 'RIGHTARROW',
  LEFT_ARROW: 'LEFTARROW',
  DOWN_ARROW: 'DOWNARROW',
  UP_ARROW: 'UPARROW',
  RIGHT: 'RIGHTARROW',
  LEFT: 'LEFTARROW',
  DOWN: 'DOWNARROW',
  UP: 'UPARROW',
  NUM_LOCK: 'NUMLOCK',
  MENU: 'MENU',
  APPLICATION: 'MENU'
};
const hid = {
  40: 'ENTER',
  41: 'ESCAPE',
  42: 'BACKSPACE',
  43: 'TAB',
  44: 'SPACE',
  45: '-',
  46: '=',
  47: '[',
  48: ']',
  49: '\\',
  51: ';',
  52: "'",
  53: '`',
  54: ',',
  55: '.',
  56: '/',
  57: 'CAPSLOCK',
  70: 'PRINTSCREEN',
  71: 'SCROLLLOCK',
  72: 'PAUSE',
  73: 'INSERT',
  74: 'HOME',
  75: 'PAGEUP',
  76: 'DELETE',
  77: 'END',
  78: 'PAGEDOWN',
  79: 'RIGHTARROW',
  80: 'LEFTARROW',
  81: 'DOWNARROW',
  82: 'UPARROW',
  83: 'NUMLOCK',
  101: 'MENU'
};
const mods = ['CTRL', 'SHIFT', 'ALT', 'GUI'];

function keyName(ts, lib, env) {
  if (ts.length === 1 && ts[0].type === 'id' && ts[0].v.startsWith('KEY_') && !env.has(ts[0].v)) {
    const k = ts[0].v.slice(4);
    if (/^(LEFT|RIGHT)_(CTRL|SHIFT|ALT|GUI)$/.test(k)) {
      if (lib !== 'Keyboard') throw new ConversionError('Use a MOD_* mask for DigiKeyboard modifiers.', ts[0].line);
      if (k.startsWith('RIGHT')) throw new ConversionError('Right-side modifiers require manual adaptation.', ts[0].line);
      return mods[['CTRL', 'SHIFT', 'ALT', 'GUI'].indexOf(k.split('_')[1])];
    }
    if (named[k]) return named[k];
    if (/^F(?:[1-9]|1[0-2])$/.test(k)) return k;
    if (/^[A-Z0-9]$/.test(k) && lib === 'DigiKeyboard') return k.toLowerCase();
    throw new ConversionError('Unsupported key: KEY_' + k, ts[0].line);
  }
  if (ts.length === 1 && ts[0].type === 'char' && lib === 'Keyboard') {
    const c = ts[0].v;
    if (c === '\r') throw new ConversionError('Use KEY_RETURN for a return key; ASCII carriage return is not mapped as Enter by the default Keyboard layout.', ts[0].line);
    if (c === '\n') return 'ENTER';
    if (c === '\t') return 'TAB';
    if (c === ' ') return 'SPACE';
    if (/[a-z0-9]/.test(c)) return c;
    throw new ConversionError('This character key needs manual adaptation: ' + c, ts[0].line);
  }
  const n = evaluate(ts, env);
  if (lib === 'Keyboard') {
    if (n >= 128 && n <= 131) return mods[n - 128];
    if (n >= 132 && n <= 135) throw new ConversionError('Right-side modifier is not supported.', ts[0]?.line);
    if (n < 128) {
      if (n === 13) throw new ConversionError('Use KEY_RETURN for a return key; ASCII carriage return is not mapped as Enter by the default Keyboard layout.', ts[0]?.line);
      if (n === 10) return 'ENTER';
      if (n === 9) return 'TAB';
      if (n === 32) return 'SPACE';
      if (n >= 97 && n <= 122 || n >= 48 && n <= 57) return String.fromCharCode(n);
      throw new ConversionError('Unsupported ASCII key: ' + n, ts[0]?.line);
    }
    return hidName(n - 136, ts[0]?.line);
  }
  return n === 0 ? null : hidName(n, ts[0]?.line);
}

function hidName(n, line) {
  if (n >= 4 && n <= 29) return String.fromCharCode(97 + n - 4);
  if (n >= 30 && n <= 38) return String(n - 29);
  if (n === 39) return '0';
  if (n >= 58 && n <= 69) return 'F' + (n - 57);
  if (hid[n]) return hid[n];
  throw new ConversionError('Unsupported HID usage: ' + n, line);
}
/**
 * Translate a bounded Arduino keyboard subset without executing source.
 * @param {string} source Arduino source text (maximum 200,000 characters).
 * @param {{loop?: 'once'|'repeat'|'setup', comments?: boolean, initialDelay?: number, target?: '1.0'|'2.0'|'3.0', device?: string}} options
 * @returns {{ok:boolean, script:string, diagnostics:Array, sourceMap:Array, stats:Object}}
 * Failed output is never returned in script; partialScript is diagnostic only.
 */
export function convert(source, options = {}) {
  const opts = {
    loop: 'once',
    comments: true,
    initialDelay: 0,
    target: '3.0',
    device: 'generic',
    ...options
  };
  const diagnostics = [],
    lines = [],
    sourceMap = [];
  let steps = 0,
    delayMs = 0,
    converted = 0;
  const held = new Set();
  const report = (severity, message, line = 1) => {
    if (!diagnostics.some(d => d.severity === severity && d.message === message && d.line === line)) diagnostics.push({
      severity,
      message,
      line
    });
  };
  const emit = (text, line = 1) => {
    if (lines.length >= 10000) throw new ConversionError('Output limit: 10,000 lines.', line);
    lines.push(text);
    sourceMap.push({
      outputLine: lines.length,
      sourceLine: line
    });
  };
  const hold = (key, line) => {
    if (!held.has(key)) {
      if (!mods.includes(key) && [...held].filter(k => !mods.includes(k)).length >= 6) throw new ConversionError('Keyboard supports at most six non-modifier keys held at once.', line);
      if (mods.includes(key)) emit('INJECT_MOD', line);
      emit('HOLD ' + key, line);
      held.add(key);
    }
  };
  const release = (key, line) => {
    if (held.has(key)) {
      if (mods.includes(key)) emit('INJECT_MOD', line);
      emit('RELEASE ' + key, line);
      held.delete(key);
    }
  };
  const releaseAll = line => {
    for (const k of [...held].reverse()) release(k, line);
  };
  const env = new Map([
    ['true', 1],
    ['false', 0],
    ['HIGH', 1],
    ['LOW', 0],
    ['OUTPUT', 1],
    ['INPUT', 0]
  ]);
  for (const [i, m] of mods.entries()) {
    env.set('MOD_' + ['CONTROL', 'SHIFT', 'ALT', 'GUI'][i] + '_LEFT', 1 << i);
    env.set('MOD_' + ['CONTROL', 'SHIFT', 'ALT', 'GUI'][i] + '_RIGHT', 1 << (i + 4));
  }
  const protectedGlobals = new WeakMap();
  const bindingTypes = expressionTypes;
  const constants = new WeakMap();
  const ranges = new WeakMap();
  let program;
  const getTypes = scope => {
    if (!bindingTypes.has(scope)) bindingTypes.set(scope, new Map());
    return bindingTypes.get(scope);
  };
  const getRanges = scope => {
    if (!ranges.has(scope)) ranges.set(scope, new Map());
    return ranges.get(scope);
  };
  const bounds = decl => decl.includes('char') ? [0, 127] : decl.includes('byte') || decl.includes('uint8_t') ? [0, 255] : decl.includes('uint16_t') ? [0, 65535] : decl.includes('uint32_t') ? [0, 4294967295] : decl.includes('long') ? (decl.includes('unsigned') ? [0, 4294967295] : [-2147483648, 2147483647]) : decl.includes('bool') ? [0, 1] : decl.includes('unsigned') ? [0, 65535] : [-32768, 32767];
  const validateValue = (scope, name, line) => {
    const a = getRanges(scope).get(name),
      x = scope.get(name);
    if (a && (typeof x !== 'number' || !Number.isSafeInteger(x) || x < a[0] || x > a[1])) throw new ConversionError('Value outside declared type range: ' + name, line);
  };
  const getConst = scope => {
    if (!constants.has(scope)) constants.set(scope, new Set());
    return constants.get(scope);
  };
  try {
    if (typeof source !== 'string' || source.length > 200000) throw new ConversionError('Source limit: 200,000 characters.');
    if (!['1.0', '2.0', '3.0'].includes(opts.target)) throw new ConversionError('Choose DuckyScript 1.0, 2.0 or 3.0.');
    const device = targets.find(t => t.id === opts.device);
    if (!device) throw new ConversionError('Unknown device preset.');
    if (device.language && device.language !== opts.target) throw new ConversionError('The device preset does not match the selected language.');
    if (!Number.isInteger(opts.initialDelay) || opts.initialDelay < 0 || opts.initialDelay > 4294967295) throw new ConversionError('Startup delay must be an integer from 0 to 4,294,967,295 ms.');
    if (opts.target !== '3.0' && opts.loop === 'repeat') throw new ConversionError('Continuous repetition requires DuckyScript 3.0. Choose one iteration or setup only.');
    if (typeof opts.comments !== 'boolean') throw new ConversionError('comments must be a boolean.');
    if (!['once', 'repeat', 'setup'].includes(opts.loop)) throw new ConversionError('Invalid loop mode.');
    program = new Parser(preprocess(tokenize(source))).program();
    for (const name of ['setup', 'loop']) {
      const f = program.functions.get(name);
      if (f && f.params.length && f.params.map(t => t.v).join('') !== 'void') throw new ConversionError(name + ' must not have parameters.', f.line);
    }
    emit('REM InoQuill ' + VERSION + ' | DuckyScript ' + opts.target);
    if (opts.target === '3.0') emit('ATTACKMODE HID');
    emitDelay(opts.initialDelay, 1);

    function emitDelay(n, line) {
      const minimum = opts.target === '3.0' ? 20 : 1,
        maximum = opts.target === '2.0' ? 10000 : 65535;
      if (!Number.isInteger(n) || n < 0 || n > 4294967295) throw new ConversionError('Delay must be an integer from 0 to 4,294,967,295 ms.', line);
      if (n === 0) return;
      if (n < minimum) throw new ConversionError('DuckyScript ' + opts.target + ' requires delays of at least ' + minimum + ' ms. Increase the delay explicitly; InoQuill will not change timing silently.', line);
      const count = Math.ceil(n / maximum);
      if (lines.length + count > 10000) throw new ConversionError('This delay would exceed the 10,000-line output budget.', line);
      if (count > 1) report('info', 'Long delay split into ' + count + ' commands; total wait preserved at ' + n + ' ms.', line);
      delayMs += n;
      let remaining = n;
      while (remaining) {
        let chunk = Math.min(maximum, remaining);
        if (remaining > maximum && remaining - chunk < minimum) chunk -= minimum - (remaining - chunk);
        emit('DELAY ' + chunk, line);
        remaining -= chunk;
      }
    }

    function textOutput(text, line) {
      if (/\$[A-Za-z_]/.test(text)) throw new ConversionError('Text contains a $ reference; review destination interpolation before converting.', line);
      if (/[^\x09\x0a\x0d\x20-\x7e]/.test(text)) throw new ConversionError('Non-ASCII text needs keyboard-layout adaptation.', line);
      // Preserve spaces and tabs instead of relying on STRING trimming.
      const chunks = text.split(/(\r\n|[\n\r\t])/);
      for (const s of chunks) {
        if (!s) continue;
        if (/^ +$/.test(s)) {
          for (let j = 0; j < s.length; j++) emit('SPACE', line);
        } else if (s === '\t') emit('TAB', line);
        else if (/[\r\n]/.test(s)) emit('ENTER', line);
        else {
          const m = s.match(/^( *)(.*?)( *)$/);
          for (let j = 0; j < m[1].length; j++) emit('SPACE', line);
          if (m[2]) emit('STRING ' + m[2], line);
          for (let j = 0; j < m[3].length; j++) emit('SPACE', line);
        }
      }
    }

    function call(ts, line, scope, depth) {
      let j = ts.findIndex(t => t.v === '(');
      if (j < 1 || v(ts.at(-1)) !== ')') throw new ConversionError('Unsupported statement.', line);
      const name = ts.slice(0, j).map(t => t.v).join(''),
        args = split(ts.slice(j + 1, -1));
      if (args.length === 1 && !args[0].length) args.pop();
      const ev = n => evaluate(args[n] ?? [], scope);
      const count = (n) => {
        if (args.length !== n) throw new ConversionError(name + ' requires ' + n + ' argument(s).', line);
      };
      if (name === 'delay' || name === 'DigiKeyboard.delay') {
        count(1);
        emitDelay(ev(0), line);
        converted++;
        return;
      }
      if (['DigiKeyboard.update', 'Keyboard.begin', 'Keyboard.end'].includes(name)) {
        count(0);
        report('info', name + ' configures source-device USB state; it produces no keystroke.', line);
        return;
      }
      if (name === 'pinMode' || name === 'digitalWrite') {
        count(2);
        report('warning', name + ' has no destination GPIO equivalent and is omitted.', line);
        if (opts.comments) emit('REM OMITTED ' + name + ' (GPIO)', line);
        return;
      }
      const m = name.match(/^(DigiKeyboard|Keyboard)\.(print|println|write|press|release|releaseAll|sendKeyStroke|sendKeyPress)$/);
      if (m) {
        const [, lib, method] = m;
        if (method === 'print' || method === 'println') {
          if (held.size) throw new ConversionError('Printing while keys are held requires manual adaptation.', line);
          if (method === 'println' && args.length === 0) {
            emit('ENTER', line);
            converted++;
            return;
          }
          count(1);
          const typed = evaluateTyped(args[0], scope);
          const val = typed.value;
          const isChar = typed.kind === 'char';
          if (lib === 'Keyboard' && isChar && val === 13) throw new ConversionError('A carriage-return character needs manual adaptation; use KEY_RETURN for Enter.', line);
          const text = isChar ? String.fromCharCode(val) : String(val);
          textOutput(lib === 'Keyboard' && typed.kind === 'string' ? text.replaceAll('\r', '') : text, line);
          if (method === 'println') emit('ENTER', line);
          converted++;
          return;
        }
        if (method === 'releaseAll') {
          if (lib !== 'Keyboard') throw new ConversionError('Invalid DigiKeyboard method.', line);
          count(0);
          releaseAll(line);
          converted++;
          return;
        }
        if (['sendKeyStroke', 'sendKeyPress'].includes(method)) {
          if (lib !== 'DigiKeyboard') throw new ConversionError('Invalid Keyboard method.', line);
          if (args.length < 1 || args.length > 2) throw new ConversionError('Expected a key and an optional modifier mask.', line);
          const key = keyName(args[0], lib, scope),
            mask = args[1] ? ev(1) : 0;
          if (!Number.isInteger(mask) || mask < 0 || mask > 15) throw new ConversionError('Unsupported mask: use left-side modifiers (0–15).', line);
          const combination = mods.filter((_, i) => mask & (1 << i));
          if (key) combination.push(key);
          if (method === 'sendKeyPress') {
            releaseAll(line);
            for (const k of combination) hold(k, line);
          } else {
            releaseAll(line);
            if (combination.length) emit((!key ? 'INJECT_MOD ' : '') + combination.join(' '), line);
          }
          converted++;
          return;
        }
        if (lib !== 'Keyboard') throw new ConversionError('Unsupported DigiKeyboard method: ' + method, line);
        count(1);
        const key = keyName(args[0], lib, scope);
        if (method === 'press') hold(key, line);
        else if (method === 'release') release(key, line);
        else if (method === 'write') {
          const already = held.has(key);
          if (already) throw new ConversionError('Writing a key that is already held requires manual adaptation.', line);
          hold(key, line);
          release(key, line);
        }
        converted++;
        return;
      }
      const f = program.functions.get(name);
      if (f) {
        if (depth >= 16) throw new ConversionError('Recursive or excessively deep function calls.', line);
        const ps = split(f.params).filter(p => p.length);
        if (ps.length === 1 && ps[0].map(t => t.v).join('') === 'void') ps.pop();
        if (args.length !== ps.length) throw new ConversionError('Incorrect argument count: ' + name, line);
        const local = new Map(env);
        bindingTypes.set(local, new Map(getTypes(env)));
        ranges.set(local, new Map(getRanges(env)));
        constants.set(local, new Set(getConst(env)));
        const protectedNames = new Set(scope.keys());
        protectedGlobals.set(local, protectedNames);
        ps.forEach((p, i) => {
          if (p.some(t => ['*', '&', '[', ']', '='].includes(t.v))) throw new ConversionError('Complex function parameters are not supported.', line);
          local.set(p.at(-1).v, ev(i));
          getTypes(local).set(p.at(-1).v, declarationType(p.slice(0, -1).map(t => t.v)));
          getRanges(local).set(p.at(-1).v, bounds(p.map(t => t.v)));
          validateValue(local, p.at(-1).v, line);
          protectedNames.delete(p.at(-1).v);
        });
        run(f.body, local, depth + 1);
        return;
      }
      throw new ConversionError('Unsupported call: ' + name, line);
    }

    function simple(ts, line, scope, depth) {
      if (!ts.length) return;
      let j = 0;
      while (types.has(v(ts[j]))) j++;
      if (j) {
        let rest = ts.slice(j);
        const pointer = v(rest[0]) === '*';
        if (pointer && !ts.slice(0, j).some(t => t.v === 'char')) throw new ConversionError('Only literal char pointers are supported.', line);
        if (pointer) rest = rest.slice(1);
        const name = rest[0]?.v;
        let k = 1;
        if (v(rest[k]) === '[' && v(rest[k + 1]) === ']') k += 2;
        if (!name || v(rest[k]) !== '=') throw new ConversionError('Only initialized variables and string arrays are supported.', line);
        const declaration = ts.slice(0, j).map(t => t.v);
        declarationType(declaration);
        if (k > 1 && !declaration.includes('char')) throw new ConversionError('Only literal char arrays are supported.', line);
        if (scope.has(name)) throw new ConversionError('Variable shadowing or redeclaration needs manual adaptation: ' + name, line);
        if (declaration.includes('static')) throw new ConversionError('Static local state needs manual adaptation.', line);
        if (declaration.includes('void')) throw new ConversionError('A variable cannot have type void.', line);
        if (getConst(scope).has(name)) throw new ConversionError('Cannot shadow a constant: ' + name, line);
        const val = evaluate(rest.slice(k + 1), scope);
        const expectsString = pointer || k > 1 || declaration.includes('String');
        if (expectsString && typeof val !== 'string') throw new ConversionError('A string declaration requires constant text.', line);
        if (!expectsString && !declaration.includes('char') && typeof val === 'string') throw new ConversionError('An integer declaration requires a numeric value.', line);
        const kind = declaration.includes('char') && k === 1 && !pointer ? 'char' : typeof val === 'string' ? 'string' : 'number';
        if (declaration.includes('char') && k > 1 && typeof val !== 'string') throw new ConversionError('String arrays need literal text.', line);
        if (kind === 'char' && (typeof val !== 'number' || val < 0 || val > 127)) throw new ConversionError('char values must be ASCII.', line);
        scope.set(name, val);
        getTypes(scope).set(name, kind === 'string' ? {
          kind: 'string'
        } : declarationType(declaration));
        if (kind !== 'string') {
          getRanges(scope).set(name, bounds(declaration));
          validateValue(scope, name, line);
        }
        if (declaration.includes('const')) getConst(scope).add(name);
        protectedGlobals.get(scope)?.delete(name);
        return;
      }
      if (ts[0].type === 'id' && ['=', '+=', '-=', '++', '--'].includes(v(ts[1]))) {
        const name = ts[0].v,
          op = ts[1].v;
        if (getConst(scope).has(name)) throw new ConversionError('Cannot modify a constant: ' + name, line);
        if (protectedGlobals.get(scope)?.has(name)) throw new ConversionError('A helper or continuous loop cannot modify inherited state: ' + name, line);
        if (!scope.has(name)) throw new ConversionError('Undeclared variable: ' + name, line);
        if (['++', '--'].includes(op)) {
          if (ts.length !== 2) throw new ConversionError('Unsupported increment.', line);
          scope.set(name, scope.get(name) + (op === '++' ? 1 : -1));
        } else {
          const b = evaluate(ts.slice(2), scope);
          if (getTypes(scope).get(name)?.kind === 'string' && (typeof b !== 'string' || op !== '=')) throw new ConversionError('String reassignment requires literal text and =.', line);
          scope.set(name, op === '=' ? b : op === '+=' ? scope.get(name) + b : scope.get(name) - b);
        }
        validateValue(scope, name, line);
        if (scope !== env && depth === 0 && env.has(name)) env.set(name, scope.get(name));
        return;
      }
      call(ts, line, scope, depth);
    }

    function runScoped(node, scope, depth) {
      return run(node.kind === 'block' ? node : {
        kind: 'block',
        body: [node],
        line: node.line
      }, scope, depth);
    }

    function run(node, scope, depth = 0) {
      if (++steps > 5000) throw new ConversionError('5,000-step limit: excessive or infinite loop.', node.line);
      switch (node.kind) {
        case 'empty':
          return;
        case 'block': {
          const before = new Map(scope);
          for (const n of node.body) {
            const r = run(n, scope, depth);
            if (r) {
              restoreScope();
              return r;
            }
          }
          restoreScope();
          return;

          function restoreScope() {
            for (const key of [...scope.keys()])
              if (!before.has(key)) {
                scope.delete(key);
                getTypes(scope).delete(key);
                getConst(scope).delete(key);
                getRanges(scope).delete(key);
              }
          }
        }
        case 'simple':
          simple(node.expr, node.line, scope, depth);
          return;
        case 'return':
          if (node.expr.length) throw new ConversionError('Return values are not supported.', node.line);
          return 'return';
        case 'break':
          if (node.expr.length) throw new ConversionError('break does not take an expression.', node.line);
          return 'break';
        case 'if':
          return runScoped(evaluate(node.expr, scope) ? node.body : node.alternate ?? {
            kind: 'empty',
            line: node.line
          }, scope, depth);
        case 'for': {
          const p = split(node.expr, ';');
          const beforeKeys = new Set(scope.keys());
          if (p.length !== 3) throw new ConversionError('Invalid for() statement.', node.line);
          simple(p[0], node.line, scope, depth);
          let iterations = 0;
          while (evaluate(p[1], scope)) {
            if (++iterations > 1000) throw new ConversionError('Maximum 1,000 iterations per loop.', node.line);
            const r = runScoped(node.body, scope, depth);
            if (r === 'return') return r;
            if (r === 'break') break;
            simple(p[2], node.line, scope, depth);
          }
          for (const key of [...scope.keys()])
            if (!beforeKeys.has(key)) {
              scope.delete(key);
              getTypes(scope).delete(key);
              getConst(scope).delete(key);
              getRanges(scope).delete(key);
            } return;
        }
        case 'while': {
          if (node.body.kind === 'empty' || node.body.kind === 'block' && !node.body.body.length) {
            if (evaluate(node.expr, scope)) throw new ConversionError('An empty infinite wait loop requires manual adaptation.', node.line);
            return;
          }
          let iterations = 0;
          while (evaluate(node.expr, scope)) {
            if (++iterations > 1000) throw new ConversionError('An unbounded while loop requires manual adaptation.', node.line);
            const r = runScoped(node.body, scope, depth);
            if (r === 'return') return r;
            if (r === 'break') break;
          }
          return;
        }
      }
    }
    for (const g of program.globals) {
      if (g.kind !== 'directive' && (g.kind !== 'simple' || !types.has(v(g.expr[0])))) throw new ConversionError('Executable statements are not allowed outside functions.', g.line);
      run(g, env);
    }
    if (!program.functions.has('setup') && !program.functions.has('loop')) throw new ConversionError('The sketch must define setup() or loop().');
    if (program.functions.has('setup')) {
      if (opts.comments) emit('REM setup()');
      const setupScope = new Map(env);
      bindingTypes.set(setupScope, new Map(getTypes(env)));
      ranges.set(setupScope, new Map(getRanges(env)));
      constants.set(setupScope, new Set(getConst(env)));
      run(program.functions.get('setup').body, setupScope);
      for (const key of env.keys())
        if (setupScope.has(key)) env.set(key, setupScope.get(key));
    }
    if (opts.loop !== 'setup' && program.functions.has('loop')) {
      if (opts.comments) emit('REM loop() ' + (opts.loop === 'once' ? 'one iteration' : 'continuous repetition'));
      if (opts.loop === 'repeat') {
        emit('WHILE TRUE');
        protectedGlobals.set(env, new Set(env.keys()));
      }
      run(program.functions.get('loop').body, env);
      if (held.size) {
        report('warning', 'Pending held keys are released at the end of the iteration.', program.functions.get('loop').line);
        releaseAll(program.functions.get('loop').line);
      }
      if (opts.loop === 'repeat') emit('END_WHILE');
      else report('warning', 'loop() is translated once. Arduino normally repeats it.', program.functions.get('loop').line);
    }
    if (held.size) {
      report('warning', 'Pending held keys are released at the end of the script.');
      releaseAll(1);
    }
    if (converted === 0) report('warning', 'No keyboard operations or delays were found.');
    if (opts.target !== '3.0') lowerClassic();
    if (opts.device === 'key-croc') wrapQuack();
    report('info', 'Delay totals exclude USB transport and typing time; real timing may differ.');

    function wrapQuack() {
      const quote = text => "'" + text.replaceAll("'", "'\"'\"'") + "'";
      for (let i = 0; i < lines.length; i++) {
        const text = lines[i];
        lines[i] = text.startsWith('REM ') ? '# ' + text.slice(4) : text.startsWith('STRING ') ? 'QUACK STRING ' + quote(text.slice(7)) : 'QUACK ' + (text.startsWith('DELAY ') ? text : text.replaceAll(' ', '-'));
      }
      report('info', 'Key Croc output is an inline QUACK snippet. Add it to a separately configured, authorized device payload.');
    }

    function lowerClassic() {
      const output = [],
        mapping = [],
        pressed = new Set();
      let flushed = false,
        firstLine = 1;
      const add = (text, line) => {
        output.push(text);
        mapping.push({
          outputLine: output.length,
          sourceLine: line
        });
      };
      for (let i = 0; i < lines.length; i++) {
        const text = lines[i],
          line = sourceMap[i].sourceLine;
        if (text === 'INJECT_MOD') continue;
        if (text.startsWith('INJECT_MOD ')) throw new ConversionError('Standalone modifiers require a device-specific command. Add a key or adapt the sequence manually.', line);
        if (text.startsWith('HOLD ')) {
          if (flushed) throw new ConversionError('Overlapping key holds cannot be represented in this portable target.', line);
          if (!pressed.size) firstLine = line;
          pressed.add(text.slice(5));
          continue;
        }
        if (text.startsWith('RELEASE ')) {
          if (!flushed) {
            const keys = [...pressed];
            if (keys.every(k => mods.includes(k)) || keys.filter(k => !mods.includes(k)).length > 1) throw new ConversionError('This held-key sequence cannot be represented as a portable shortcut.', line);
            const modifiers = keys.filter(k => mods.includes(k)),
              key = keys.find(k => !mods.includes(k));
            const chord = (modifiers.length ? modifiers.join('-') + ' ' : '') + key;
            add(keys.length === 1 && /^[a-z0-9]$/.test(chord) ? 'STRING ' + chord : chord, firstLine);
            flushed = true;
            report('info', 'An immediate press/release sequence was converted to a portable key tap or shortcut.', firstLine);
          }
          pressed.delete(text.slice(8));
          if (!pressed.size) flushed = false;
          continue;
        }
        if (pressed.size && !text.startsWith('REM')) throw new ConversionError('Timed or overlapping key holds require DuckyScript 3.0. Select a compatible target or adapt the sequence manually.', line);
        const match = text.match(/^((?:(?:CTRL|SHIFT|ALT|GUI) )+)(.+)$/);
        const portable = match ? match[1].trim().split(' ').join('-') + ' ' + match[2] : text;
        add(/^[a-z0-9]$/.test(portable) ? 'STRING ' + portable : portable, line);
      }
      lines.splice(0, lines.length, ...output);
      sourceMap.splice(0, sourceMap.length, ...mapping);
    }
  } catch (e) {
    report('error', e.message, e.line || 1);
  }
  const errors = diagnostics.filter(d => d.severity === 'error').length;
  return {
    version: VERSION,
    ok: errors === 0,
    script: errors ? '' : lines.join('\n') + '\n',
    partialScript: lines.join('\n') + '\n',
    diagnostics,
    sourceMap,
    stats: {
      commands: lines.filter(s => !s.startsWith('REM') && !s.startsWith('#')).length,
      converted,
      delayMs,
      sourceLines: typeof source === 'string' ? source.split('\n').length : 0
    },
    options: opts
  };
}
