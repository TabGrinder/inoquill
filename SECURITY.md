# Security policy

Maintainer: **TabGrinder**. Current maintained release line: **1.0.x**. The public release remains v1.0 until TabGrinder approves a version change.

## Report privately

When this project is published, use GitHub private vulnerability reporting if enabled. Otherwise ask TabGrinder for a secure contact method without posting exploit details publicly. Do not include secrets, personal data or live unauthorized targets. No contact email, response SLA, bounty or security certification is implied.

Provide the affected version, minimal reproduction, trust boundary crossed and proposed mitigation. A regression-only reproduction is preferable to a harmful payload.

## Trust boundaries

Pasted/imported source, file names, output and diagnostics are untrusted text. The application does not execute source code, call a system shell, access devices, upload sketches or retain them in browser storage. Browser conversion runs in a worker with a timeout and parser/interpreter budgets. UI rendering uses text sinks. The local server limits public assets, methods and resolved paths.

These controls reduce risk; they do not guarantee the absence of vulnerabilities. A valid converted script can still perform unwanted actions. The application is a translator, not a payload-safety classifier. Browser extensions, asset tampering, final-host configuration and downstream execution must be assessed separately.

The local static server is a development utility, not an independently audited internet-facing service. It binds to loopback by default. Deploy the static app through a maintained host, verify actual security headers, and keep Node/browser versions supported.

## Verification

See [Release review](docs/Release-Review.md), the test suite and the compatibility matrix. No independent penetration test, physical-device test, complete WCAG audit or proprietary destination compiler verification has been performed. Enable private reporting and review repository permissions before public release.

## Developer-run assessment

See [Security assessment](docs/Security-Assessment.md) for the local test scope, reproduced hidden-file alias finding, verified fixes, and outstanding production/browser/device checks. Keep the static root trusted and free of secrets. This development server is not a hardened public upload service.
