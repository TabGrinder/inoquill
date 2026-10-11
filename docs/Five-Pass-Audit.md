# InoQuill v1.0 — Five-pass audit and remediation

Date: 10 October 2026. Maintainer: TabGrinder.

## What this report represents

Five sequential developer-run reviews were performed using different assessment lenses. Each round examined the current source after the preceding corrections and ran focused checks before the next round began. They are not five independent organizations, branded audit firms, external attestations or certifications. No company endorsement is claimed.

The scope includes application source, controlled local HTTP requests, harmless converter fixtures, CLI input/output, asynchronous Workbench behavior, generated documentation and the downloadable release. Production infrastructure, account authorization, physical devices, proprietary compiler acceptance and interactive browser/assistive-technology behavior are outside the executed scope. The UI remains English and the public version remains v1.0.

## Round 1 — Security and input boundaries

**Finding A1-01: bounded-size validation did not bound the CLI read itself.** The CLI checked a path's size and then read the entire file separately. A changing file could grow after the check. It also relied on filesystem errors to handle non-regular input. This is a local robustness issue; no production exploit or data disclosure was demonstrated.

**Remediation:** CLI input now uses one file handle, checks that handle's metadata, reads at most 200,001 bytes and rejects anything above the 200,000-byte limit. The allocation is bounded. Nonblocking open is requested where supported, regular-file validation remains mandatory, UTF-8 decoding is strict and the handle closes in a finally block. Existing NUL rejection remains. This does not provide a filesystem snapshot or eliminate concurrent modification of a regular file.

**Evidence:** focused input tests exercised valid UTF-8/BOM, directories, malformed UTF-8, NUL bytes, the exact byte boundary and one byte above it. Existing local HTTP/adversarial cases continued to pass. File growth was addressed by the fixed read budget and source review; a timed race exploit was not demonstrated.

## Round 2 — Result and export integrity

**Finding A2-01: colliding script and report paths could leave an unexpected artifact.** With both options pointing to the same new path, the CLI wrote JSON there before refusing to overwrite it with the script. Overwrite protection worked, but the user received a failed command and an unexpected file.

**Remediation:** normalized identical script/report paths are rejected before conversion or output creation. Existing exclusive writes remain. Distinct paths that alias through filesystem symlinks still depend on exclusive-open protection. Multi-file output is not transactional: an I/O failure can leave one successfully written artifact, which must be inspected.

**Evidence:** a regression verifies exit status 2 and no output file for a normalized path collision. CLI, three output-profile and converter tests passed together: 51 tests. The converter and profile definitions were unchanged.

## Round 3 — Reliability and asynchronous imports

**Finding A3-01: browser text decoding could silently replace malformed UTF-8.** File.text uses replacement decoding. The displayed source could therefore differ from the imported bytes without an explicit encoding error. Unsupported resulting text might later be blocked, but the import itself lacked a clear explanation.

**Remediation:** import reads the file bytes and uses strict UTF-8 decoding, rechecks the byte limit and displays a clear encoding message. The earlier import sequence/revision gate still prevents obsolete reads from replacing a newer selection or edit. NUL detection, worker timeouts and stale clipboard protections remain.

**Evidence:** valid BOM input, malformed bytes and oversized browser imports were tested. Both import completion orders and clipboard/worker regressions passed: eight focused tests. No destructive script was executed or enabled.

## Round 4 — Accessibility and graceful degradation

**Finding A4-01: a visitor with JavaScript disabled saw an inert conversion interface without a dedicated explanation.** Added a noscript explanation and a direct project download for CLI use.

**Finding A4-02: source-trace table headers lacked explicit column scopes and a table caption.** Added column scopes and a concise caption available to assistive technology.

**Evidence:** two structural tests passed. They exercise the actual Wiki renderer's heading levels, table scopes and text-only code rendering, and verify the fallback and source-trace structure. These are source/DOM-structure checks, not visual tests or a WCAG conformance determination. Previously added heading focus and search status remain. Manual browser and screen-reader checks are still required.

## Round 5 — Release, documentation and governance

**Finding A5-01: SECURITY.md advertised a maintained 2.x release while package.json, the converter, the interface and the user's release decision specify 1.0.0.** Corrected the security policy to 1.0.x/v1.0 and added an automated consistency assertion.

**Finding A5-02: accessibility reference IDs were not checked by the release checker.** The checker now verifies each aria-describedby/aria-labelledby target exists, in addition to interface/Wiki links, asset checks and module syntax.

**Remediation and evidence:** Wiki/README/CLI documentation was updated for strict UTF-8 input, independent script/report paths and audit boundaries. Audit reports are copied from their canonical documents into the web release. The deterministic ZIP and SHA-256 were rebuilt. The ZIP was checked for entry integrity, source/report inclusion and checksum consistency. The extracted source package passed its own project checks.

## Final validation and release decision

All 65 automated tests passed, including the existing three-profile conversion regressions, malformed-input tests, CLI overwrite controls, local HTTP boundaries and the added input, path-collision, browser decoding and accessibility-structure cases. Project checks and the extracted release package passed. The converter, worker and target-profile source files were unchanged throughout these five rounds.

No additional exploitable security vulnerability was demonstrated in the exercised scope. The findings above are robustness, usability, accessibility-structure and governance issues; they are not evidence of a production compromise. Existing conditional filesystem risks and hosting/device/browser verification limits remain. No zero-vulnerability or universal-compatibility claim is made.

Release remains v1.0. A separate independent assessment should validate actual hosting controls and browser behavior before any certification or broader assurance claim.

## Primary guidance

- OWASP DOM based XSS Prevention: https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html
- Node.js filesystem API: https://nodejs.org/api/fs.html
- W3C status messages: https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html
- W3C target size guidance: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
