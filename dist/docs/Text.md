# Text and escaping

> InoQuill v1.0.0 by TabGrinder

See how spaces, line breaks, and escape sequences become DuckyScript.

InoQuill reads the supported C++ string first, then writes the corresponding DuckyScript instructions. Escape sequences are interpreted as C++ text rather than copied directly into the output.

| Source text | Output behavior |
| --- | --- |
| Normal ASCII text | STRING text |
| Leading or trailing spaces | One SPACE per space |
| Internal spaces | Remain inside STRING |
| \t | TAB |
| \n or \r | ENTER for newline; Keyboard string writes discard carriage returns |
| \r\n | One ENTER |
| println() | An additional ENTER after the supplied text |
| \\ and escaped quotes | Literal backslash or quote |
| F("a" "b") | Concatenated constant text |

## Whitespace example

```cpp
Keyboard.print("  a b  ");
```

```text
SPACE
SPACE
STRING a b
SPACE
SPACE
```

## Text limits

- Non-ASCII text is blocked because mapping and encoding depend on the source and target layouts.
- Text containing a dollar sign followed by a letter or underscore needs review because DuckyScript may interpret it as a variable reference. This check does not reject every dollar sign.
- NUL and unsupported control characters are rejected. Hex escapes are limited to two digits.
- Numbers passed to print are written in decimal. Additional formatting arguments, such as HEX or a precision value, are not supported in v1.0.

Use printable, harmless text in examples and reports. Reports may contain translated strings, so remove personal data before sharing them.

A hexadecimal escape consumes every following hex digit, as in C++. Use adjacent strings to separate an escape from following digits: "\x41" "42" prints A42. Hex escapes outside ASCII are rejected. Arduino Keyboard string writes discard carriage returns; newline still becomes ENTER.

A backslash immediately followed by a line ending joins physical lines before comments and tokens are read, as in C++. This also applies inside // comments. Source trace keeps the original physical line numbers. LF, CRLF, and CR line endings are recognized. Whitespace between the backslash and the line ending is rejected because compilers handle that extension differently.

