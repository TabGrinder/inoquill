# Second semantic review

InoQuill v1.0.0 · 11 October 2026 · developer-run review

## Baseline and findings

The reviewed baseline was commit f39118dbe32b36443c450d0ef5556d97788ff5b7. Its 100 tests passed. Four additional cases were then checked with an independent C++17 compiler and against DuckyScript profiles 1.0, 2.0 and 3.0. All 12 new regression cases failed before the changes.

| Case | C++ reference | Previous output | Correction |
| --- | --- | --- | --- |
| char text[]="ABC"; char *p=text; p++; print(p) | BC | ABC1 | Explicit error: pointer arithmetic is outside the supported subset; no script is exported |
| Empty char array used as an if condition | The array address is non-null; take the true branch | Took the false branch | Require numeric/Boolean conditions; reject ambiguous text/pointer conditions |
| int x=0; digitalWrite(1,++x); print(x) | 1 | 0 with a GPIO-omission notice | Check arguments before omission; reject side effects or unresolved calls |
| Backslash-newline at the end of a // comment, followed by print("A"), then print("B") | B | AB | Join escaped physical lines before lexing comments, retaining physical line mappings |

The first three corrections deliberately reject unsupported semantics. They do not claim to add pointer execution, string truth evaluation or side-effecting expression execution. Valid supported numeric control flow and side-effect-free GPIO omission remain available.

## Related corrections

- Prevent String increment/decrement and char-array reassignment from silently using JavaScript coercion.
- Check both arguments of pinMode and digitalWrite, including nested unresolved calls and assignment expressions.
- Handle line joining in identifiers, string literals and object-like macros; preserve original source lines after LF, CRLF and CR input.
- Reject whitespace after a continuation backslash because it depends on compiler extensions.
- Count source lines consistently for the supported line endings.

## Verification

- 119 automated tests pass, with no failures or skipped tests.
- The new four-case suite failed 12/12 on the baseline and passes 12/12 after the changes.
- 313 expression cases are evaluated independently by g++ and compared with all three profiles: 939 comparisons. The generated expressions are deterministic and use ABI-independent fixed-width operands. AVR-only rules retain separate assertions.
- An additional native C++ reference confirms BC, YES, 1 and B for the four boundary cases.
- 1,000 deterministic malformed inputs return errors without uncaught exceptions or exported scripts. This is a limited corpus, not exhaustive fuzzing.
- Related tests cover text mutation, if/while/for conditions, pure vs side-effecting GPIO calls, line endings and physical source tracing.
- Full checks include the existing CLI, local-server, import, export, Wiki and regression tests. No production infrastructure was penetration-tested.

## Remaining verification

Real-browser interaction, destination-compiler acceptance and physical-device execution remain unverified. The required browser-control plugin and physical devices were unavailable. Follow Device-Acceptance.md. A passing test suite does not certify a general C++ compiler, all board ABIs, firmware compatibility, timing or keyboard layouts.

Do not interpret the v1.0.0 label as independent certification. Use the commit ID and deployment result to identify the published implementation.
