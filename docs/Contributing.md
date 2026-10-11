# Contributing

> InoQuill v1.0.0 by TabGrinder

Add supported behavior with tests, documentation and attribution.

InoQuill welcomes clear bug reports, documentation fixes and bounded improvements to keyboard translation. Prefer an exact supported behavior over a feature that silently guesses at hardware intent.

## A good change

- Provide a minimal source fixture and expected output.
- Cite the upstream library or destination documentation that establishes semantics.
- Add a regression test that demonstrates the actual failure or new behavior.
- Keep safe examples focused on typing, shortcuts and controlled learning.
- Update the compatibility matrix, wiki and changelog together.
- Run npm run check before submitting a pull request.

## Design rules

- Do not use eval, Function or shell execution to interpret sketches.
- Do not introduce telemetry, remote conversion or storage without an explicit product decision.
- Keep source-derived UI content as text.
- Do not copy third-party code, brand assets or licenses into the project without meeting their terms.
- Keep documentation candid about unsupported behavior and verification limits.

Be respectful, explain disagreements with reproducible evidence, and redact sensitive source. Security reports use the private process, not the bug template.

