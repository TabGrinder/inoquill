# Community validation

InoQuill v1.0.0 · 11 October 2026

This is a developer-run validation record, not an independent audit or a certification of device compatibility. Version 1.0.0 remains the release label requested by the maintainer; use the Git commit to identify the exact implementation.

## Reproduced and corrected

The original implementation failed all 12 new regression cases: four semantic bugs tested against three output profiles. The fixes preserve unsigned right shifts, parenthesized char printing, textual macro precedence, and explicit key definitions.

Additional regression checks cover AVR integer promotions and suffixes, signed overflow, unsigned wrapping, macro aliases and recursive expansion, full-length hex escapes, helper parameter types, block and unbraced-statement scope, invalid declarations, Keyboard.end behavior, six-key rollover limits, carriage returns in Keyboard string writes, and immediate invalidation when editing startup delay.

## Automated evidence

`npm run check`: 137 tests passed, none failed or skipped. The test suite includes an independent C++17 compiler oracle: 313 expressions, checked against all three output profiles (939 comparisons). It uses fixed-width 32-bit values and other ABI-independent examples. AVR-specific 16-bit promotion rules have explicit regression assertions; a native desktop compiler does not independently validate the AVR ABI.

The oracle compiles and executes only source written inside the test fixture, never uploaded sketches. Tests require g++; the browser and CLI do not. Existing tests also check UTF-8 import handling, race conditions, clipboard fallback, failed-export controls, Wiki routing, safe rendering, CLI boundaries and local-server access. DOM simulations are not real-browser tests.

## Publication and interaction

The public repository is https://github.com/TabGrinder/inoquill and the Pages URL is https://tabgrinder.github.io/inoquill/. The published site returned HTTP 200 and its nine main resources matched the uploaded source during the initial deployment check. Updated deployment state must be checked after each release.

| Environment | Status | Acceptance criteria |
| --- | --- | --- |
| Node engine and regression suite | Passed | Current `npm run check` output is authoritative |
| Native C++ expression oracle | Passed | 313 expressions across three output profiles |
| Chrome / Edge desktop | Pending | Import, paste, convert, Undo, copy, download, report, theme, keyboard navigation and Wiki |
| Firefox / Safari desktop | Pending | Same workflow; module workers, clipboard fallback and Blob downloads |
| Mobile Chrome / Safari | Pending | Readable controls, native file picker, downloads and no unintended horizontal scrolling |
| Destination compilation | Pending | Compile the generated source with the supported firmware's tools |
| USB Rubber Ducky classic / 2022 | Pending | Greeting, numbers, punctuation, timing and release behavior on hardware |
| Flipper Zero | Pending | Load the generated text through BadUSB and compare typed output |
| Bash Bunny / Key Croc | Pending | Configure HID/triggers and verify the correct QUACK format on hardware |

The required browser-control plugin was unavailable, and no USB devices were connected to the test environment. Browser or physical-device success must not be inferred from automated tests. Follow [Device acceptance](Device-Acceptance.md) and record firmware, layout, compiler and commit with each result.

## Reporting problems

Use the Workbench's **Report an issue on GitHub** link or https://github.com/TabGrinder/inoquill/issues/new?template=bug_report.yml. **Prepare bug report** downloads a local template with browser and conversion settings. It does not submit anything or attach code. The JSON conversion report can contain translated strings; redact it before posting. Report security vulnerabilities using SECURITY.md, not public issue details.

## Second semantic review

See [Second semantic review](Second-Semantic-Review.md) for the four reproduced bugs, the 12 initially failing target-specific cases, remediation and verification evidence. The suite also runs 1,000 deterministic malformed inputs and verifies that failed conversions never export output. This corpus is regression evidence, not proof against all possible inputs.

## Keyboard report review

See [Keyboard report review](Keyboard-Report-Review.md) for nine regressions that failed before the fixes, the independent report-state model and remaining acceptance work.

## Input, export and declaration review

See [the latest review](Full-Project-Review.md) for array-initializer validation, import checks, report filenames and CLI delay handling. The suite now includes 137 tests; real-browser and hardware acceptance remain pending.
