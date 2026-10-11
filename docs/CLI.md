# Command-line usage

> InoQuill v1.0.0 by TabGrinder

Convert files locally with the same engine and safe file handling.

```sh
node cli.mjs examples/hello.ino --target 1.0 --device flipper-zero --out greeting.txt
node cli.mjs examples/hello.ino --target 2.0 --device bash-bunny --out keystrokes.txt
node cli.mjs examples/hello.ino --target 3.0 --device rubber-ducky-2022 --out ducky-source.txt
```

--target selects 1.0, 2.0, or 3.0 (default 3.0). --device selects a preset (default generic). Both values must agree for fixed presets. Source output never executes, compiles, or deploys keystrokes.

```sh
node cli.mjs examples/hello.ino
node cli.mjs examples/hello.ino --out greeting.txt
node cli.mjs examples/bounded-loop.ino --loop setup --report review.json
node cli.mjs --help
```

Completed DuckyScript goes to stdout unless --out is specified. Diagnostics go to stderr. Output files are created exclusively: existing files are never overwritten. On translation errors, no script is written. A report excludes partial output and never includes the original Sketch.

| Flag | Purpose |
| --- | --- |
| --out FILE | Write completed script to a new file |
| --report FILE | Write review JSON to a new file |
| --loop once\|repeat\|setup | Choose the entry-point treatment |
| --delay N | Add a startup delay |
| --no-comments | Omit structural comments |
| --help | Print usage |

| Exit code | Meaning |
| --- | --- |
| 0 | Translation succeeded |
| 1 | Translation blocked |
| 2 | Usage or file error |

The CLI is for a local development workflow, not a multi-tenant upload service. Do not expose it as a web endpoint or shell out using untrusted arguments. Like the UI, it does not generate inject.bin.

Inputs must be regular UTF-8 files, optionally with a UTF-8 BOM, no NUL bytes and at most 200,000 bytes. Script and report paths must differ. Existing files are never overwritten. Multi-file output is not transactional; inspect any created artifact if the command reports an I/O failure.

