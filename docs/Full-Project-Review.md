# Input, export and declaration review

InoQuill v1.0.0 · 12 October 2026

Baseline: `bba7889e1769d850002136e147d2aaa7442366dc`. This is a developer-run review of the repository and its automated checks, not an independent penetration-test certification.

## Findings and changes

| Finding | Impact | Change and evidence |
| --- | --- | --- |
| Invalid char-array initialization accepted | A successful translation could conceal C++ code that does not compile | Reject array copies, pointer arrays and nonliteral array initializers. Three negative C++ fixtures are independently rejected by g++; regression checks cover all three output profiles. Literal and macro-to-literal initializers remain supported. |
| Long report filenames lost `.review.json` | Downloaded reports could be difficult to identify or open | Truncate the stem while preserving the suffix. Prefix reserved Windows stems such as CON. Handler tests verify both cases. |
| Whitespace-only CLI delay became zero | Invalid command-line input silently changed timing settings | Reject the value with exit status 2 and no script on stdout. |
| Shared import reader checked size only after reading | The exported reader could allocate an oversized file if called outside the current UI guard | Check declared size before reading and actual size afterward. Centralize NUL rejection in the reader. Existing UI protection is retained through that shared function. This was defense in depth, not a demonstrated UI bypass. |
| Security-header assumptions differed by host | Local-server protections could be mistaken for Pages protections | Document that the host-specific `_headers` file is not browser policy and that the HTML CSP cannot supply response-level framing protection. |

## Verification

Eight tests were added: seven failed against the previous implementation; the independent C++ negative-fixture test already passed because the compiler correctly rejected those declarations. All eight pass with the changes.

The complete suite passes **137 tests**, with no failures or skips. Coverage includes the existing 939 expression/profile comparisons, 1,200 HID report transitions, deterministic malformed inputs, source mapping, target presets, CLI files, import races, clipboard fallback, failed-export controls, Wiki search/navigation, accessibility structure and local-server restrictions. `npm run check`, `npm run build` and `git diff --check` pass.

The security review checked text-only rendering, CSP configuration, local-server path/method/Host restrictions, input budgets, dependency metadata and deployment workflows. No new dependency was added. This scope does not establish that every vulnerability has been found.

## Acceptance still required

| Area | Status |
| --- | --- |
| Engine, CLI, server and simulated UI handlers | Automated checks passed |
| Static Wiki/assets and build | Checks passed |
| Browser rendering and interaction | Pending; the browser-control capability was unavailable |
| Destination compiler acceptance | Pending |
| Physical devices and actual host keystrokes | Pending |
| Complete accessibility audit | Pending; structural assertions are not a WCAG certification |

The Sites workflow requires its supported browser-control capability for managed browser QA. It was unavailable, so no substitute browser run is claimed. Use Community-Validation.md and Device-Acceptance.md to record browser versions, firmware, layout and commit before claiming device compatibility.

Focused tests: `node --test tests/io-review.test.mjs tests/array-initializers.test.mjs`.
