# JavaScript API

> InoQuill v1.0.0 by TabGrinder

Use the converter module independently of the UI.

```js
import { convert, VERSION } from './dist/converter.mjs';
const review = convert(sketch, {
  target: '1.0',
  device: 'flipper-zero',
  loop: 'once',
  initialDelay: 0,
  comments: true
});
if (review.ok) console.log(review.script);
else console.error(review.diagnostics);
```

| Option | Default | Accepted values |
| --- | --- | --- |
| loop | once | once, setup, repeat (3.0 only) |
| initialDelay | 0 | Integer 0 to 4,294,967,295; positive 3.0 waits minimum 20 ms; output budget applies |
| comments | true | boolean |
| target | 3.0 | 1.0, 2.0, 3.0 |
| device | generic | rubber-ducky-2022, rubber-ducky-classic, flipper-zero, bash-bunny, key-croc, generic |

| Result field | Meaning |
| --- | --- |
| ok | No blocking translation error |
| version | Converter version |
| script | Completed output; empty on failure |
| partialScript | Diagnostic fragment only; never a valid failed export |
| diagnostics | severity, message and source line |
| sourceMap | outputLine and sourceLine pairs |
| stats | commands, converted, delayMs and sourceLines |
| options | Effective conversion options |

The API accepts source text; it does not execute it. It returns diagnostics for known unsupported inputs. Browser conversion adds worker isolation and a three-second timeout; direct Node calls retain interpreter budgets but do not automatically gain a wall-clock sandbox. Treat output and reports as potentially sensitive text.

> This is the first prepared public release. Keep versioned fixtures for any integration; do not treat the internal tokenizer or parser as a stable API.

> A fixed device preset must match the language profile or conversion fails. Use generic for manual profile selection. opts.target controls generated commands; it is not just report metadata.

