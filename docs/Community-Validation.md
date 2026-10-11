# Community validation

InoQuill v1.0.0 · 11 October 2026

This record separates automated evidence from checks that need a browser, compiler, or physical device. It is not an independent audit or a claim of universal compatibility.

## Changes informed by the comparison

Duckify's compact destination controls and script naming informed the simplified setup and editable download name. Duckuino's direct copy/download workflow and modular source informed the emphasis on export preparation and maintainable code. Existing InoQuill source trace, review notices, local processing, and conversion limits remain in place. No source or visual assets from either project were copied.

References: https://duckify.spacehuhn.com/ · https://github.com/SpacehuhnTech/duckify · https://dukweeno.github.io/Duckuino/ · https://github.com/Dukweeno/Duckuino

## Automated checks

Validation run: 74 tests passed, with no failures or skipped tests. `npm run check` and `npm run build` completed successfully. HTML structure and release labels were checked separately. Current command output remains the authoritative test count for future changes.

- Regression coverage for the three DuckyScript profiles and all device presets.
- Keyboard-punctuation example converted for every preset with source tracing and a three-second startup delay.
- Undo history bounds, snapshot isolation, restore order, original filename, and custom export name.
- Safe output names, path removal, Windows reserved names, and version-specific extensions.
- Successful-result-only downloads and report templates that exclude sketch/output text.
- Existing malformed-input, bounded-processing, import-race, stale-copy, server-boundary, and documentation checks.
- Repository-subpath resource checks and generated user guides.
- Converter formatting checked against the previous implementation across 126 example, device, and loop-mode combinations.

## Direct verification matrix

| Environment | Status | Acceptance criteria |
| --- | --- | --- |
| Chrome / Edge desktop | Pending | Import, paste, convert, Undo, name export, copy, download, report, theme and keyboard navigation |
| Firefox desktop | Pending | Same workflow; module worker and clipboard fallback |
| Safari desktop | Pending | Same workflow; module worker, Blob download and focus behavior |
| Mobile Chrome / Safari | Pending | Readable controls, no unintended horizontal page scrolling, native file picker and download |
| USB Rubber Ducky (2022) | Pending | PayloadStudio compilation, selected layout, harmless greeting and punctuation check |
| Classic USB Rubber Ducky | Pending | Compatible encoder and the same harmless checks |
| Flipper Zero | Pending | Load text through BadUSB; verify layout and timing |
| Bash Bunny / Key Croc | Pending | Prepare device payload and triggers; verify QUACK output on authorized hardware |
| GitHub Pages final URL | Pending | Publication has not occurred; verify worker, Wiki, links and downloads under /inoquill/ |

Browser automation was unavailable in this session. No interactive browser or physical-device result is implied by passing the automated checks. Site deployment is verified separately through the hosting service.

## Useful community feedback

Record the InoQuill version, browser version, device and firmware, keyboard layout, conversion settings, expected result, and actual result. Use Prepare bug report for a local template. Review every attachment before sharing it. The existing JSON conversion report may contain translated source text.

Public GitHub issue tracking is not configured in this build. No inactive issue link is included in the interface. Reports can be shared with the maintainer through the community channel used to distribute the app.
