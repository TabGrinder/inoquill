# InoQuill v1.0 — Security assessment

Date: 2026-10-09. Maintainer: TabGrinder.

## Scope and method

This assessment covers the checked-out application source, its Node.js static server on an ephemeral loopback port, converter inputs, export boundaries, and generated release files. Tests used temporary directories and synthetic canary files. No user credentials, destructive payloads, network scans, availability attacks, or other tenants were targeted. Production hosting authentication, provider infrastructure, browser interaction, compiler acceptance, and physical devices were not penetration-tested.

The work combines source review and executable local adversarial tests. It is a developer-run assessment, not an independent penetration-test certification. The methodology was informed by OWASP WSTG directory traversal guidance and official Node.js HTTP documentation.

## Findings and fixes

| ID | Classification | Evidence before the change | Resolution and verification |
| --- | --- | --- | --- |
| S-01 | Low, conditional information exposure | A public alias symlink to an in-root hidden Markdown canary returned HTTP 200 and the canary text. This requires an operator or another process to place a hidden file and alias in the public root. | Canonical relative-path segments are checked for hidden names. The same request now returns 403, as does an alias into a hidden directory. Outside-root aliases remain blocked. |
| H-01 | Defense in depth | Files were read without an explicit regular-file or size check; HEAD loaded the entire file. No resource exhaustion attack was performed. | Only regular files up to 5 MiB are served. HEAD sends metadata without reading the file body. Tests verify 413 for an oversized synthetic asset and an empty HEAD body. |
| H-02 | Defense in depth | The local server did not restrict Host or cross-site browser requests and used runtime timeout defaults. No DNS rebinding exploit was demonstrated. | Foreign Host and Sec-Fetch-Site cross-site requests return 403. Header, request, keep-alive, and per-socket request limits are configured and verified. |
| U-01 | Usability and result integrity | Informational notices preceded blocking errors; failure messages could disappear after a toast. | Errors are shown first, with a persistent summary, source-line buttons, and relevant guide links. Timeout and worker-start failures also remain visible. |
| U-02 | Usability and state integrity | An asynchronous file read could replace edits made while the import was pending. | Import checks the workspace revision before applying the file. Stale imports are skipped with an explanation. |

## Executed checks

- Raw local HTTP requests: hidden aliases, hidden names, malformed encoding, encoded separators, nested paths, foreign Host, cross-site metadata, GET/HEAD, and rejected write methods.
- Synthetic asset exceeding 5 MiB, server header/timeout configuration, and canary non-disclosure.
- Adversarial converter cases across DuckyScript 1.0, 2.0, and 3.0: HTML-like text, unknown calls, excessive loops/delays, include paths, unsupported text references, and control characters.
- Existing 300-case deterministic malformed-input corpus, source-size/token/nesting/iteration/output budgets, CLI overwrite protection, and target compatibility tests.
- Source checks confirm text-only UI rendering and absence of eval/new Function in the converter. These checks are evidence for the reviewed paths, not a proof that all XSS possibilities are absent.
- All 56 automated tests pass. Wiki/assets/module checks and ZIP integrity checks pass.

## Remaining risks and boundaries

The public root must be trusted and immutable while serving; concurrent filesystem replacement races are not eliminated by this development server. Do not place secrets in dist, including ordinary non-hidden files. This server is intended for local development, not as a public multi-tenant service or reverse-proxy backend. Binding beyond loopback does not add authentication. Browser fetch metadata is optional and is not authentication. Limits reduce individual-request resource use but are not a load-tested denial-of-service defense.

Generated scripts are text that may perform harmful actions if deployed. InoQuill does not assess payload intent or certify that an output is safe. Unsupported constructs remain blocked, including the current dollar-identifier text limitation. This assessment does not change that compatibility boundary or enable previously refused destructive payloads.

Interactive browser tests, production access-control testing, layout/device testing, and independent review remain outstanding. Findings concern this exact source revision and scope; no zero-vulnerability claim is made.

## Primary references

- https://wstg.owasp.org/latest/4-Web_Application_Security_Testing/05-Authorization/01-Directory_Traversal_File_Include/
- https://nodejs.org/api/http.html
