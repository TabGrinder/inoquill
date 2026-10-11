# InoQuill

**Arduino keyboard sketches to DuckyScript 1.0, 2.0, and 3.0. By TabGrinder.**

Translate known keyboard sequences locally. Inspect source-line mappings, review deliberate adaptations, and choose a destination device and export source for its supported language profile.

Use the [web app](https://tabgrinder.github.io/inoquill/) to try an example without installing anything.

**For educational purposes only.** Use only on systems you own or are explicitly authorized to assess. Read the [full disclaimer](DISCLAIMER.md). A successful translation is not a safety verdict or a guarantee of compiler/device compatibility.

## Why this project

InoQuill grew out of an appreciation for Spacehuhn’s Duckify, Duckuino, SAPSAN Terminal, and Hak5’s documentation. Their work inspired this project and helped make it possible. Thank you to the creators and contributors who make these tools and resources available to everyone.

Duckify and Duckuino convert DuckyScript to Arduino. InoQuill explores the reverse direction for a documented subset of DigiKeyboard and Arduino Keyboard sketches. It aims to make each conversion easy to review, with clear explanations when an operation needs attention. See [References and thanks](wiki/References.md) for links and further reading.

## Start in a minute

Node.js 20 or later. No packages to install.

```sh
npm start
```

Open `http://127.0.0.1:3000`. Import an `.ino`, paste source or try a harmless example. Choose an output language, device preset, and how to handle `loop()`. Convert and review the diagnostics before downloading.

```sh
node cli.mjs examples/hello.ino --target 1.0 --device flipper-zero --out greeting.txt
```

CLI outputs never overwrite existing files. `.txt` is DuckyScript source; this project does not compile `inject.bin` or execute keystrokes.

The Workbench follows three steps: **Add a sketch**, **Convert and review**, and **Download your script**. Language and device controls appear above the editors, with loading instructions underneath. The Project view explains scope and credits; the web UI offers scripts, review reports, and bug-report templates.

## A small example

```cpp
#include "DigiKeyboard.h"
void setup() {
  DigiKeyboard.delay(2000);
  DigiKeyboard.println("Hello from InoQuill!");
}
void loop() {}
```

Core output with the DuckyScript 3.0 target:

```text
ATTACKMODE HID
DELAY 2000
STRING Hello from InoQuill!
ENTER
```

## Choose your output target

| Language | Device presets | Export |
| --- | --- | --- |
| DuckyScript 1.0 | Classic USB Rubber Ducky, Flipper Zero | Portable keystroke text; compile for classic hardware, load text for Flipper |
| DuckyScript 2.0 | Bash Bunny, Key Croc | Bash Bunny: keystroke file; Key Croc: quoted QUACK snippet; triggers are configured separately |
| DuckyScript 3.0 | USB Rubber Ducky (2022) | Source with HID mode, holds, and native continuous loops; compile in PayloadStudio |

Use Other compatible device to choose a language manually. A language version is not a universal hardware compatibility guarantee. See [Output targets](wiki/Output-Targets.md). DuckyScript 2.0 exports use the shared keystroke subset. The Bash Bunny preset produces a file for QUACK loading; the Key Croc preset emits an inline QUACK snippet with shell-quoted STRING arguments. Configure device triggers separately.

Long waits are split into commands of at most 65,535 ms (10,000 ms for the 2.0 profile), preserving the total. Positive 3.0 delays must be at least 20 ms; the portable 1.0/2.0 profiles accept positive integer milliseconds. Input delays must fit an unsigned 32-bit value, and every export remains subject to the 10,000-line budget.

## Practical features

- DigiKeyboard and Arduino Keyboard key mappings kept separate.
- Constant text, modifiers, held keys, explicit delays, bounded loops and simple void helpers.
- Three `loop()` modes, with continuous repetition available for the 3.0 target.
- DuckyScript 1.0, 2.0, and 3.0 profiles, device presets, and exact-total long-delay splitting.
- Source trace, line-linked diagnostics and JSON review reports.
- Worker isolation with bounded source, syntax, iterations, steps and output.
- Browser-local processing: no conversion network calls, telemetry or sketch storage.
- Recover the last five replaced sketches with Undo, choose a download name, and prepare a bug report without attaching code.
- Clear three-step workflow, a compact step bar, light/dark themes, responsive spacing, and locally available interface/code font stacks.
- English workbench and searchable 10-topic wiki, generated from one canonical source.
- Dependency-free Node CLI, local server, regression tests and release tooling.

## Documentation

| Task | Guide |
| --- | --- |
| First conversion | [Getting started](wiki/Getting-Started.md) |
| Select a language or device | [Output targets](wiki/Output-Targets.md) |
| Check supported syntax | [Compatibility](wiki/Compatibility.md) |
| Understand library key codes | [Keys](wiki/Keys.md) |
| Preserve text and whitespace | [Text and escaping](wiki/Text.md) |
| Understand static control flow | [Control flow](wiki/Control-Flow.md) |
| Diagnose blocked output | [Diagnostics](wiki/Diagnostics.md) |
| Integrate the module | [API](docs/API.md) |
| Convert from a terminal | [CLI](docs/CLI.md) |
| Host the app | [Deployment](docs/Deployment.md) |
| Review trust boundaries | [Security policy](SECURITY.md) |
| Publish as TabGrinder | [GitHub preparation](docs/GitHub.md) |
| Review release evidence | [Release review](docs/Release-Review.md) |

## Development

Tests require Node.js 20+ and `g++` (C++17) for the independent expression oracle. The browser app and CLI do not need a C++ compiler. `npm test` intentionally fails if the oracle compiler is missing.

```sh
npm run docs   # regenerate web and GitHub wiki content
npm run check  # tests plus asset/docs/source checks
npm run build  # private source ZIP and SHA-256 in releases/
```

Serve `dist/` with HTTP/HTTPS; `file://` is unsupported. `PORT` changes the local port; `HOST` defaults to loopback. The static application uses relative URLs and is suitable for repository-subpath hosting.

## Project layout

```text
dist/                  browser app, converter, worker, generated wiki
examples/              harmless Arduino fixtures and expected output
wiki/                  generated GitHub wiki Markdown
docs/wiki-data.json    canonical wiki content
scripts/               documentation, validation and ZIP tooling
tests/                 converter, server, CLI and release regression tests
cli.mjs                local file conversion
server.mjs             static local server
.github/               CI, optional Pages deployment and contribution templates
```

## Compatibility and security limits

InoQuill is a subset translator, not a C++ compiler or Arduino emulator. Dynamic sensors, Serial, Mouse, complex types, variable shadowing, static local state, function macros, non-ASCII text and right-side modifiers are outside this release. Unsupported behavior blocks export. GPIO is omitted with a notice.

Integer handling models AVR 16-bit int and 32-bit long promotions. Unsigned arithmetic wraps at its promoted width; signed overflow and out-of-range assignments are rejected. Macros use token substitution. This is not a cross-board C++ ABI implementation. Source timing, USB transport, keyboard layout and host focus still require review. See the matrix before relying on a translation.

Automated tests cover engine behavior, malformed input, server boundaries and release artifacts. This release has not undergone independent security assessment, interactive visual browser QA, PayloadStudio compilation or physical Rubber Ducky verification. Header enforcement depends on the final host. No claim of zero vulnerabilities is made.

## Publish under TabGrinder

Source: [TabGrinder/inoquill](https://github.com/TabGrinder/inoquill). The public app is hosted at [GitHub Pages](https://tabgrinder.github.io/inoquill/). The Pages workflow checks and deploys updates to `main`; it can also be started manually. Public source can be downloaded, cloned, and forked. The embedded Wiki ships with the app; GitHub's separate Wiki requires separate initialization.

Report reproducible problems using [the issue form](https://github.com/TabGrinder/inoquill/issues/new?template=bug_report.yml). Prepare bug report downloads local settings without your sketch. Review attachments before posting. See [current validation evidence](docs/Community-Validation.md) and [device acceptance steps](docs/Device-Acceptance.md).

## Credits and licensing

Original project implementation and prose by the InoQuill project, maintained by **TabGrinder**. [MIT license](LICENSE). Research references are credited in [References](wiki/References.md); third-party source and logos are not bundled. The standard MIT license wording is retained as a license.

DuckyScript and USB Rubber Ducky are trademarks of Hak5 LLC. InoQuill is independent and is not affiliated with or endorsed by Hak5, Arduino, Spacehuhn or SAPSAN.

## Appearance

Use the Light mode/Dark mode button in the header. The app starts with your system preference and keeps manual changes in memory until reload. No sketch or theme preference is saved to browser storage. The Project tab explains Clear boundaries. Installation and CLI instructions are available in the repository documentation.

## Security assessment

A developer-run source and loopback assessment fixed a conditional hidden-file alias disclosure and added asset, host, and HTTP limits. See [scope, findings, evidence, and remaining risks](docs/Security-Assessment.md). The result view now prioritizes blocking errors and keeps failure summaries visible. The report does not certify production infrastructure, device behavior, or absence of vulnerabilities.

## Engineering review

The latest review fixed overlapping imports and stale clipboard fallback, avoids restarting an active conversion, and searches full Wiki content. Navigation focuses the destination heading and search reports its result count to assistive technology. See [findings and validation limits](docs/Professional-Review.md). Automated tests passed at that review; interactive browser and physical-device checks remain pending.

## Five-pass audit

Five sequential developer-run reviews hardened bounded CLI input, rejected colliding script/report paths, added strict UTF-8 imports and improved no-JavaScript guidance and source-trace table structure. Security policy now consistently identifies v1.0. Automated tests passed at that review. See [audit rounds, evidence and outstanding checks](docs/Five-Pass-Audit.md). These reviews do not represent independent companies or certify the application. Imported files must be valid UTF-8 and at most 200,000 bytes.

## Lightweight user interface

The web Wiki contains ten user guides and loads only when opened. Per-guide Markdown download controls and developer/release topics are removed from the web Wiki. Developer documents remain in docs/ in the source package. The workbench layout, light/dark themes and v1.0 converter are unchanged.

## Web publication

The public website serves dist/ only. Project ZIP archives and checksums are built under releases/, outside the web root. The application offers downloads of converted scripts and review reports, not the entire project. Do not copy releases/ into the hosted assets. Browser-delivered application assets are still readable by visitors.

## Name and publication readiness

InoQuill combines `.ino`, the Arduino sketch extension, with “quill”, a writing pen: translating sketches into scripts. This is the project’s name, not a claim of exclusive trademark rights.

See [publication readiness](docs/Publication-Readiness.md) for the license, public-source implications, current evidence and final-host checks. GitHub Pages availability has been checked; browser interaction and hardware acceptance are tracked separately.

## Validation record

See [Community validation](docs/Community-Validation.md) for automated evidence and the browser, compiler, and hardware checks still awaiting direct verification.

## Latest semantic validation

The second review corrected continued-comment handling and stops unsupported pointer/text operations, nonnumeric conditions and GPIO arguments with side effects before export. The current suite has 129 tests, a C++ oracle comparing 313 expressions across three profiles, and 1,000 deterministic malformed-input cases. See [the detailed evidence and limits](docs/Second-Semantic-Review.md). Browser interaction and physical-device acceptance remain pending.

## Keyboard report review

The latest review fixes repeated DigiKeyboard reports and numeric-looking text passed as key codes. Ten new tests cover these cases and 1,200 deterministic HID report transitions. See [the report](docs/Keyboard-Report-Review.md). Browser and hardware acceptance remain pending.
