# Compatibility

> InoQuill v1.0.0 by TabGrinder

Check which parts of your sketch can be translated and where changes may be needed.

> InoQuill supports the Arduino keyboard operations listed below. It does not support all of C++, the Arduino preprocessor, board firmware, or every DuckyScript feature.

| Source operation | Translation | Review requirement |
| --- | --- | --- |
| DigiKeyboard.print / println | STRING with whitespace keys; println adds ENTER | ASCII text only; no printing with held keys |
| sendKeyStroke(key, mask) | Key combination with left-side modifiers | DigiKeyboard numbers are HID usages |
| sendKeyPress(key, mask) | 3.0: HOLD / RELEASE; portable targets: immediate tap/shortcut only | USB report timing differs |
| Keyboard.press / release / releaseAll | 3.0: explicit held-key state; portable targets: immediate tap/shortcut only | Right-side modifiers are not supported |
| Keyboard.write | Press and release a supported key | Review the Keys page for ASCII constraints |
| delay / DigiKeyboard.delay | DELAY with a resolved value | 0 is omitted; 3.0 minimum 20 ms; long waits split without changing the total |
| Keyboard.begin / end; DigiKeyboard.update | No equivalent device initialization command | end does not release held keys; no USB emulation |
| pinMode / digitalWrite | Omitted with a notice | Confirm GPIO is not essential |
| Object #define and initialized variables | Textual macro expansion; typed constant evaluation | Object-like macros only; no conditional preprocessing |
| if; bounded for / while | Evaluate and expand locally | No host or sensor state |
| Simple void helpers | Expand calls with value parameters | No mutation of inherited state |
| loop() | Once, continuously, or excluded | Continuous mode rejects evolving global state |

## Values and expressions

Integer expressions use an AVR model: 16-bit int and 32-bit long, with signedness, integer promotions, and U/L literal suffixes preserved. Unsigned arithmetic wraps at its promoted width; signed overflow and out-of-range assignments are rejected. This is not a cross-board C++ compiler. Parentheses preserve char values when printing; arithmetic promotes them to numbers. Literal strings, adjacent strings, and F("text") are supported. Long-long declarations and suffixes are not supported; larger unsuffixed literals can be used only while values remain exactly representable.

## What is not supported

- Sensors, analogRead, digitalRead, Serial, network libraries, Mouse and host feedback.
- Classes, templates, structs, complex pointers, general arrays, casts, floating point and function return values.
- Recursive or overloaded functions, static local state, variable shadowing and function-style macros.
- Right-side modifiers, non-ASCII text, multimedia and a complete numeric-keypad mapping.
- Leading-zero numeric literals: write decimal, hex or binary explicitly.

## Size and processing limits

| Resource | Limit |
| --- | --- |
| Imported file | 200,000 bytes |
| Source API input | 200,000 characters |
| Tokens | 50,000 |
| Syntax nesting | 64 levels |
| Each loop | 1,000 iterations |
| Interpreter steps | 5,000 |
| Function calls | 16 nested levels |
| Output | 10,000 lines |
| Browser worker | 3 seconds |

- [Control flow](Control-Flow)
- [Troubleshooting](Diagnostics)

## Macros and source types

Object-like macros expand as C++ tokens before parsing. For example, #define N 1 + 2 makes N * 3 evaluate to 7, while #define N (1 + 2) makes it 9. Explicit key definitions override built-in key names. Recursive macro expansion, function macros, and conditional preprocessing require manual adaptation. Expansion is bounded to 32 levels, 50,000 output tokens, and 100,000 token visits.

