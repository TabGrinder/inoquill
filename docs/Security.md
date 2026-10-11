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

After publication, use the repository Security tab and its private reporting form if TabGrinder has enabled it. Until a private channel is available, ask the maintainer for a secure contact method without publishing exploit details. Do not invent a contact address or post private data in a public issue.

## Evidence and limits

The release review records parser regression tests, server path/method checks and a deterministic malformed-input corpus. No claim of independent penetration testing, full WCAG conformance, destination compiler acceptance, physical-device verification or freedom from vulnerabilities is made.

- [Security policy](Security.md)
- [Release review](Release-Review.md)

## Developer-run security assessment

The local assessment reproduced and fixed hidden-file disclosure through an in-root symlink alias. Additional hardening rejects foreign Host and cross-site requests, restricts served assets to regular files up to 5 MiB, and sets HTTP timeouts. The 56-test suite includes adversarial local HTTP requests and converter cases. Production access controls, browser interaction, device behavior, and an independent audit remain unverified.

The 10 October engineering review corrected overlapping imports, stale clipboard fallback, duplicate target invalidation and repeated conversion shortcuts. It also improved guide search and keyboard navigation. All 60 automated tests passed. The source package includes docs/Professional-Review.md with scope, findings and outstanding browser, production and device checks.

Five sequential developer-run audit rounds covered input security, export integrity, import reliability, accessibility structure and release consistency. They corrected bounded CLI reads, colliding script/report paths, strict browser UTF-8 imports, no-JavaScript guidance, source-trace table structure and the maintained-version policy. All 65 automated tests passed. Read docs/Five-Pass-Audit.md in the source package for evidence and limitations. These rounds are not independent company audits or certifications.

