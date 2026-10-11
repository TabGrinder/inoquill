# Keyboard report review

InoQuill v1.0.0 · 11 October 2026

This is a developer review, not an independent certification. The baseline was GitHub commit `74abd8bc802c147c899edad60d03e8930da15f2b`.

## Reproduced defects

| Case | Previous result | Correction |
| --- | --- | --- |
| Repeat `DigiKeyboard.sendKeyPress(KEY_A)` before releasing | Releases and presses A again, creating an extra keydown | Keeps A held |
| Stroke A while A is already held | Creates another keydown | Applies the report and then releases A |
| Change a report while retaining its key or modifier | Releases and presses shared keys | Changes only keys entering or leaving the report |
| `Keyboard.write("176")` | Emits Enter instead of recognizing a text overload | Reports an unsupported argument; no export |
| Numeric-looking text passed to press/release or DigiKeyboard key methods | JavaScript coercion can produce a key or modifier | Requires an integer byte code |

The argument fix deliberately does not claim to implement Arduino buffer overloads. Use print for supported text. Rejecting an unsupported operation is preferable to producing a different keyboard action.

## Evidence

Nine regression tests failed on the baseline and passed after correction. A tenth test compares 100 deterministic sequences (1,200 report transitions) with a separate set-based HID report model. The model does not call the converter to construct expected results. It checks held-state transitions, not USB packet timing or destination firmware execution.

The report semantics were checked against [Digistump's DigiKeyboard.h](https://github.com/digistump/DigistumpArduino/blob/master/digistump-avr/libraries/DigisparkKeyboard/DigiKeyboard.h), retrieved blob `f5678fb01f3ed99255ecdaac2f881d51eafb677c`: sendKeyPress writes a replacement report, and sendKeyStroke calls sendKeyPress followed by an empty report.

Full validation: `npm run check` (129 tests), `npm run build`, and `git diff --check`. Existing coverage includes 939 C++ expression/profile comparisons, 1,000 malformed inputs, parser bounds, source mapping, clipboard/import races, failed-export handling, Wiki routing, safe DOM rendering and local-server boundaries.

## Remaining limits

- Real-browser interaction, destination compilation and physical-device acceptance are still pending. Automated DOM simulations and HTTP asset checks do not substitute for these steps.
- The HID model does not establish atomic equivalence between one source USB report and multiple destination HOLD/RELEASE commands. Firmware and host behavior require device tests, especially for modifier changes while a key remains held.
- The translator supports a documented subset, not arbitrary C++. Unsupported inputs must remain explicit errors rather than silently altered output.
- These results do not establish that all defects or vulnerabilities have been found. The acceptance matrix in Community-Validation.md remains the release-readiness checklist.

Run the focused regression suite with `node --test tests/key-report-regression.test.mjs`.
