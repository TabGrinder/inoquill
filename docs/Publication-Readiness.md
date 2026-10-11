# Publication readiness

InoQuill v1.0.0, maintained by TabGrinder.

## Public source and licensing

The public repository is `TabGrinder/inoquill`. GitHub Pages at `https://tabgrinder.github.io/inoquill/` responded with HTTP 200 on 11 October 2026. This verifies availability, not browser interaction or hardware behavior.

A public repository lets anyone view, download, clone and fork its contents. The web interface has no project download button, but browser-delivered HTML, CSS and JavaScript remain accessible. Do not publish secrets, private sketches or hosting credentials.

The project includes the standard MIT license, copyright 2026 TabGrinder and InoQuill contributors. MIT permits use, modification and redistribution subject to retaining its notices. The educational-use disclaimer communicates intended use and authorization boundaries; it does not add a field-of-use restriction to MIT. Publishing under MIT must remain the maintainer's deliberate choice.

## Compatibility

This is a translator for the documented subset of Arduino Keyboard and DigiKeyboard operations, not a general C++ compiler. The 1.0, 2.0 and 3.0 selectors identify output profiles. Device presets adapt source format; they do not certify firmware compatibility. Unsupported semantics remain explicit review errors. Read Compatibility and Output targets in the Wiki before implementation.

## Evidence and limits

Run `npm run check` and `npm run build` from a clean checkout. The checks validate conversion fixtures, profile behavior, input and export boundaries, module syntax, documentation links and public-asset packaging. Repository-subpath resource checks resolve static references as `/inoquill/` URLs. They are structural checks, not interactive browser tests.

No independent company audit, zero-vulnerability guarantee, universal conversion support or first-of-its-kind status is claimed. Historical review reports describe the checks performed at their dates; current command output is the authoritative test count.

## Final-host acceptance

Record results against the actual Pages URL after deployment. These checks are pending until performed:

- Open the Workbench, Wiki and Project in desktop and mobile browsers; check both themes, keyboard navigation, spacing and readable text.
- Confirm JavaScript modules, the conversion worker and lazy Wiki content load under `/inoquill/` without HTTP or console errors.
- Convert a harmless greeting for each output profile and device preset. Compare output and source trace; verify copy, script download and JSON review-report download.
- Import valid UTF-8 source and malformed or oversized input; confirm clear diagnostics and no stale result export.
- Verify actual response headers. GitHub Pages does not enforce the `_headers` template. The HTML CSP cannot supply response-level frame protection.
- Compile source using the appropriate destination tooling, then test on authorized hardware with the intended keyboard layout, startup delay and focused text editor.

The Pages workflow runs on pushes to main and can also be started manually. Inspect its result and complete the browser/device acceptance record before claiming those checks passed.
