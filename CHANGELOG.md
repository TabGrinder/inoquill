# Changelog

## Input, export and declaration review — 12 October 2026

- Reject invalid char-array initializers instead of producing apparently valid output. Add independent C++ rejection fixtures across all output profiles.
- Preserve report filename extensions and protect reserved Windows stems.
- Centralize import size and binary checks; reject oversized files before reading.
- Reject whitespace-only CLI startup delays.
- Add eight tests (137 total), update the Wiki and document hosting security-header limits. Keep v1.0.0.

## Keyboard report review — 11 October 2026

- Preserve common held keys across DigiKeyboard reports; avoid extra keydowns when repeating a report or stroking an already-held key.
- Reject text and out-of-range key-code arguments before JavaScript can coerce them into HID codes.
- Add ten tests, including 1,200 report transitions; 129 tests total. Update the Wiki and validation records.
- Keep v1.0.0. Browser and physical-device acceptance remain pending.

## Second semantic review — 11 October 2026

- Apply C++ escaped-line joining before comments/tokens while retaining physical source lines, including LF, CRLF and CR. Reject ambiguous whitespace after continuation backslashes.
- Reject text/pointer increments, text arithmetic, array reassignment and nonnumeric conditions instead of using JavaScript coercion.
- Omit GPIO only after checking both arguments are supported and side-effect-free.
- Add 19 tests (119 total), expand the independent C++ oracle to 939 profile comparisons, and run 1,000 deterministic malformed-input cases.
- Update the Wiki and validation records. Keep v1.0.0; browser and physical-device acceptance remain pending.


## Semantic correctness review — 11 October 2026

- Correct unsigned shifts, parenthesized characters, macro precedence and explicit key definitions.
- Model AVR integer promotions and unsigned arithmetic, reject signed overflow, and preserve macro/source tracing.
- Correct block scope, hex escapes, Keyboard.end state, rollover limits and Keyboard string carriage returns.
- Add 12 originally failing regressions and a native C++ oracle with 171 profile comparisons.
- Invalidate stale downloads on startup-delay edits and reject empty/invalid delays.
- Link public GitHub reporting, update publication records and provide honest browser/device acceptance steps.
- Keep version 1.0.0. Browser, destination-toolchain and physical-device verification remain pending.

## 1.0.0 — 2026-10-09

- Fixed conditional hidden-file alias disclosure in the local static server; added regular-file/size/Host/fetch-metadata checks and bounded HTTP settings.
- Added adversarial security regressions and a scoped assessment report.
- Prioritized errors, added persistent result summaries and guide links, and guarded asynchronous imports against workspace changes.

Prepared public-release identity: **InoQuill by TabGrinder**.

- Added system-aware light and dark themes with an accessible, storage-free toggle.
- Replaced the Project feature card with Clear boundaries and revised documentation wording.
- Refined Workbench, Wiki, and Project layouts; a compact workflow strip; consistent spacing and readable local fonts.
- Removed the Project setup/download card and repeated header author line; simplified the Project introduction.
- English-only workbench with black, white, red and yellow styling.
- Source trace, actionable review hints, isolated worker and timeout.
- Scoped locals, ASCII char printing, declared-type range checks and parsing budgets.
- Generated Wiki with ten user guides; developer documentation is kept separately.
- Original educational-use disclaimer, security policy and contribution guidance.
- Local CLI with exclusive file creation; hardened loopback static server.
- Deterministic source ZIP, SHA-256 checksum, CI and manual Pages workflow.
- Three language targets, device presets, exact-total long-delay splitting, and portable shortcut lowering.
- Expanded regression tests and explicit verification limits.

This is the first planned public release. Development iterations do not increment the public version: it remains v1.0 until approved by TabGrinder.

- Corrected latest-file import ordering, stale clipboard fallback and repeated conversion shortcut handling. Removed duplicate target invalidation.
- Expanded Wiki search to guide bodies, examples and tables, and improved navigation focus, heading structure and long-text wrapping.
- Added the engineering review report and checked interface-to-Wiki guide links. Public version remains v1.0.

- Completed five sequential developer-run audit rounds; see docs/Five-Pass-Audit.md.
- Bounded CLI reads through a single file handle; reject non-regular inputs and malformed UTF-8.
- Reject identical script/report paths before creating files. Browser import now rejects malformed UTF-8 explicitly.
- Added JavaScript-disabled guidance, source-trace table caption and header scopes.
- Corrected security policy to v1.0 and validated accessibility reference IDs.

- Simplified the web Wiki to ten user guides and renamed the disclaimer to Use disclaimer. Removed individual guide download controls.
- Load Wiki assets on demand, share concurrent loads, retry failures and prevent stale navigation from replacing the current view.
- Reduced interface spacing while preserving its layout and themes. Developer guides remain in the source package; conversion behavior is unchanged.

- Removed project download controls and ZIP/checksum files from the public web root. Source packaging now writes to releases/ outside dist/.
- Prepared web-only public access; converter behavior and v1.0 remain unchanged.

- Revised Workbench, device instructions, Project credits, and all ten user guides for clear, consistent wording.
- Corrected singular/plural counts and empty-editor guidance; retained v1.0 conversion behavior.

- Standardized UI labels and matching Wiki instructions, clarified device preparation and diagnostic next steps, and corrected guide links for loop and text-reference errors.
- Updated shortcut instructions for Windows, Linux, and Mac; preserved all conversion rules and output formats.

- Added bounded in-memory Undo for sketch replacement, safe custom export names, and device instructions next to export preparation.
- Collapsed secondary conversion options, added a harmless punctuation check, and introduced a bug-report template that never attaches sketch text automatically.
