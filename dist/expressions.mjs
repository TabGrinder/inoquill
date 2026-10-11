import {
  ConversionError
} from './conversion-error.mjs';
// AVR integer model: 16-bit int, 32-bit long. Never use JS bitwise coercion.
export const expressionTypes = new WeakMap();
const INT = {
  bits: 16,
  unsigned: false,
  kind: 'number'
};
const LONG = {
  bits: 32,
  unsigned: false,
  kind: 'number'
};
const LONG64 = {
  bits: 64,
  unsigned: false,
  kind: 'number'
};
const UINT = {
  ...INT,
  unsigned: true
};
const ULONG = {
  ...LONG,
  unsigned: true
};
const precedence = {
  '||': 1,
  '&&': 2,
  '|': 3,
  '^': 4,
  '&': 5,
  '==': 6,
  '!=': 6,
  '<': 7,
  '>': 7,
  '<=': 7,
  '>=': 7,
  '<<': 8,
  '>>': 8,
  '+': 9,
  '-': 9,
  '*': 10,
  '/': 10,
  '%': 10
};
export function declarationType(decl) {
  const s = decl.filter(t => !['const', 'static'].includes(t)).join(' ');
  if (/^(?:String|char)$/.test(s)) return s === 'String' ? {
    kind: 'string'
  } : {
    bits: 8,
    unsigned: false,
    kind: 'char'
  };
  if (s === 'bool') return {
    bits: 1,
    unsigned: true,
    kind: 'bool'
  };
  if (['byte', 'uint8_t', 'unsigned char'].includes(s)) return {
    bits: 8,
    unsigned: true,
    kind: 'number'
  };
  if (s === 'uint16_t') return UINT;
  if (s === 'uint32_t') return ULONG;
  if (/^(?:(?:unsigned|signed) )?long(?: int)?$/.test(s)) return s.startsWith('unsigned') ? ULONG : LONG;
  if (/^(?:(?:unsigned|signed)(?: int)?|int)$/.test(s)) return s.startsWith('unsigned') ? UINT : INT;
  throw new ConversionError('Unsupported declaration type: ' + s);
}
const minimum = t => t.unsigned ? 0n : -(1n << BigInt(t.bits - 1));
const maximum = t => (1n << BigInt(t.bits - (t.unsigned ? 0 : 1))) - 1n;
const value = (x, t) => ({
  ...t,
  value: x
});

function checked(x, t, line) {
  if (x < minimum(t) || x > maximum(t)) throw new ConversionError('Integer expression overflow under the AVR 16-bit int / 32-bit long model.', line);
  return value(x, t);
}

function cast(x, t) {
  return t.unsigned ? BigInt.asUintN(t.bits, x) : BigInt.asIntN(t.bits, x);
}

function promote(a) {
  return a.bits < 16 ? value(a.value, INT) : value(a.value, {
    bits: a.bits,
    unsigned: a.unsigned,
    kind: 'number'
  });
}

function common(a, b) {
  if (a.unsigned === b.unsigned) return a.bits >= b.bits ? a : b;
  const u = a.unsigned ? a : b,
    s = a.unsigned ? b : a;
  return u.bits >= s.bits ? u : s;
}

function literal(token) {
  const m = token.v.match(/^(0[xX][0-9a-fA-F]+|0[bB][01]+|\d+)([uUlL]*)$/);
  if (!m) throw new ConversionError('Invalid integer literal.', token.line);
  const suffix = m[2].toLowerCase();
  if (!['', 'u', 'l', 'ul', 'lu'].includes(suffix)) throw new ConversionError('Only 16-bit and 32-bit integer literal suffixes are supported.', token.line);
  if (/^0[0-9]+$/.test(m[1])) throw new ConversionError('Use decimal without leading zeros, hex, or binary.', token.line);
  const x = BigInt(m[1]);
  const candidates = suffix.includes('u') ? (suffix.includes('l') ? [ULONG] : [UINT, ULONG]) : suffix.includes('l') ? (/^0[xb]/i.test(m[1]) ? [LONG, ULONG, LONG64] : [LONG, LONG64]) : /^0[xb]/i.test(m[1]) ? [INT, UINT, LONG, ULONG, LONG64] : [INT, LONG, LONG64];
  const t = candidates.find(t => x <= maximum(t));
  if (!t) throw new ConversionError('Integer literal exceeds the supported range for its suffix.', token.line);
  return value(x, t);
}
export function evaluateTyped(ts, env) {
  let i = 0;

  function atom() {
    const t = ts[i++];
    if (!t) throw new ConversionError('Empty expression.');
    if (t.v === '(') {
      const a = expr(0);
      if (ts[i++]?.v !== ')') throw new ConversionError('Incomplete expression.', t.line);
      return a;
    }
    if (['!', '~', '-', '+'].includes(t.v)) {
      let a = atom();
      if (typeof a.value !== 'bigint') throw new ConversionError('Unary operations require numeric values.', t.line);
      a = promote(a);
      if (t.v === '!') return value(a.value === 0n ? 1n : 0n, INT);
      if (t.v === '~') return value(cast(~a.value, a), a);
      if (t.v === '+') return a;
      return a.unsigned ? value(cast(-a.value, a), a) : checked(-a.value, a, t.line);
    }
    if (t.type === 'number') return literal(t);
    if (t.type === 'char') return value(BigInt(t.v.charCodeAt(0)), {
      bits: 8,
      unsigned: false,
      kind: 'char'
    });
    if (t.type === 'string') {
      let s = t.v;
      while (ts[i]?.type === 'string') s += ts[i++].v;
      return {
        value: s,
        kind: 'string'
      };
    }
    if (t.v === 'F' && ts[i]?.v === '(') {
      i++;
      if (ts[i]?.type !== 'string') throw new ConversionError('F() requires literal text.', t.line);
      const a = atom();
      if (ts[i++]?.v !== ')') throw new ConversionError('Invalid F() wrapper.', t.line);
      return a;
    }
    if (env.has(t.v)) {
      const x = env.get(t.v);
      if (typeof x === 'string') return {
        value: x,
        kind: 'string'
      };
      const type = expressionTypes.get(env)?.get(t.v) ?? (x > 32767 || x < -32768 ? LONG : INT);
      return value(BigInt(x), type);
    }
    throw new ConversionError('Cannot resolve value: ' + t.v, t.line);
  }

  function expr(p) {
    let a = atom();
    while (precedence[ts[i]?.v] >= p) {
      const token = ts[i++],
        op = token.v;
      let b = expr(precedence[op] + 1);
      if (typeof a.value !== 'bigint' || typeof b.value !== 'bigint') throw new ConversionError('Arithmetic on strings is not supported.', token.line);
      a = promote(a);
      b = promote(b);
      if (op === '&&' || op === '||') {
        a = value(Number(op === '&&' ? a.value !== 0n && b.value !== 0n : a.value !== 0n || b.value !== 0n) === 1 ? 1n : 0n, INT);
        continue;
      }
      if (op === '<<' || op === '>>') {
        if (b.value < 0n || b.value >= BigInt(a.bits)) throw new ConversionError('Shift count must be less than the promoted operand width (' + a.bits + ').', token.line);
        if (!a.unsigned && a.value < 0n) throw new ConversionError('Shifting negative signed values needs manual adaptation.', token.line);
        const x = op === '<<' ? a.value << b.value : a.value >> b.value;
        a = a.unsigned ? value(cast(x, a), a) : checked(x, a, token.line);
        continue;
      }
      const t = common(a, b),
        x = cast(a.value, t),
        y = cast(b.value, t);
      if (['==', '!=', '<', '>', '<=', '>='].includes(op)) {
        a = value(({
          '==': x === y,
          '!=': x !== y,
          '<': x < y,
          '>': x > y,
          '<=': x <= y,
          '>=': x >= y
        })[op] ? 1n : 0n, INT);
        continue;
      }
      if ((op === '/' || op === '%') && y === 0n) throw new ConversionError('Division by zero.', token.line);
      if ((op === '/' || op === '%') && !t.unsigned && x === minimum(t) && y === -1n) throw new ConversionError('Signed division overflow.', token.line);
      const z = op === '+' ? x + y : op === '-' ? x - y : op === '*' ? x * y : op === '/' ? x / y : op === '%' ? x % y : op === '&' ? x & y : op === '|' ? x | y : x ^ y;
      a = t.unsigned ? value(cast(z, t), t) : checked(z, t, token.line);
    }
    return a;
  }
  const result = expr(0);
  if (i !== ts.length) throw new ConversionError('Unsupported expression: ' + ts.slice(i).map(t => t.v).join(' '), ts[i].line);
  if (typeof result.value === 'bigint' && (result.value > BigInt(Number.MAX_SAFE_INTEGER) || result.value < BigInt(Number.MIN_SAFE_INTEGER))) throw new ConversionError('Number outside the supported exact integer range.', ts[0]?.line);
  return {
    ...result,
    value: typeof result.value === 'bigint' ? Number(result.value) : result.value
  };
}
export const evaluate = (ts, env) => evaluateTyped(ts, env).value;
