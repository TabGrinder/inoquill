# Contributing to InoQuill

1. Open a focused issue with a redacted, harmless reproduction and expected behavior.
2. For new conversion rules, cite the primary source-library or Hak5 documentation that establishes semantics.
3. Keep the change bounded. Add a regression test and update docs/wiki-data.json.
4. Run npm run docs, npm run check and npm run build.
5. Submit a pull request explaining the problem, resulting behavior, evidence and remaining limits.

Do not silently guess at dynamic hardware behavior. Preserve text-only rendering, execution budgets, local processing and honest compatibility reporting. Do not introduce eval, Function, remote conversion, telemetry or shell execution of user source.

Cite borrowed ideas and honor third-party licenses. Do not submit copied branding or unattributed code. Contributions are offered under this repository's MIT license unless explicitly agreed otherwise. Security reports follow SECURITY.md; public issues must not contain exploit details or private data.
