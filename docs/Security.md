# Security model and reporting

> InoQuill v1.0.0 by TabGrinder

Controls, trust boundaries, reporting and verification limits.

## What is treated as untrusted

Imported source, pasted code, file names and conversion output are untrusted text. The converter recognizes a bounded syntax rather than evaluating JavaScript or invoking a system shell. The UI inserts source-derived content through textContent or textarea.value, not HTML.

## Controls in this release

- Browser conversion is isolated in a fresh worker with a three-second timeout.
- Source, tokens, nesting, steps, loops, call depth and output have fixed limits.
- The application has no conversion network calls, telemetry, browser storage or device access.
- CSP restricts external scripts and network connections; local server headers add frame and MIME protections.
- Local server path resolution blocks symlinks that escape the static root.
- CLI output files use exclusive creation; the release packager uses an explicit file allowlist.

## Threat boundaries

The worker is a responsiveness and resource-control boundary, not proof of universal sandbox security. Browser extensions, a compromised host, replacement assets and a malicious destination script are outside the application trust boundary. A valid translation can still contain unwanted keystrokes: translation is not a safety verdict.

## Report a vulnerability

Use the repository Security tab and its private reporting form if TabGrinder has enabled it. Until a private channel is available, ask the maintainer for a secure contact method without publishing exploit details. Do not invent a contact address or post private data in a public issue.

## Verification limits

Automated tests exercise the converter, input handling, rendering and local server. Browser interaction, destination compilation and physical-device behavior require separate checks. See [browser and device testing](Device-Acceptance.md) and the [security policy](../SECURITY.md).

GitHub Pages does not apply the custom response headers in `_headers`. The HTML CSP covers supported directives but cannot enforce `frame-ancestors`. Do not assume that the local server's response-header protections apply to every host.
