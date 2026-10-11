# Diagnostics and troubleshooting

> InoQuill v1.0.0 by TabGrinder

Understand conversion messages and find your next step.

## My sketch works on Digispark. Why does conversion fail?

A working Arduino sketch may use features that have no equivalent in the selected DuckyScript version. Check the first error and its source line to see which operation needs attention. Long delays are supported: for example, a 120,000 ms wait becomes DELAY 65535 followed by DELAY 54465 in the 1.0 and 3.0 profiles. The 2.0 profile uses twelve DELAY 10000 commands. The total wait stays the same.

> A notice about GPIO or DigiKeyboard.update does not prevent downloading the result. An error does. For the 3.0 profile, a positive delay must be at least 20 ms. If you need help with another error, share a small example that reproduces it and include your selected device and language.

| Symptom | Meaning | Next step |
| --- | --- | --- |
| Cannot resolve value | Expression depends on unavailable data | Replace with a documented constant or adapt manually |
| Unsupported call | This function is not supported by the converter | Check the Compatibility guide before changing or removing the call |
| Review: GPIO omitted | Hardware action has no equivalent | Confirm it is optional for your sequence |
| Pending held keys released | Keys still held at the end of the sketch are released in the output | Add explicit source releases if that matches your intent |
| The converter could not load | App was not served correctly or browser blocked modules | Reload the page. For a local copy, serve dist over HTTP/HTTPS and check module loading in the browser console. |
| Conversion took longer than 3 seconds | Conversion took longer than the three-second limit | Try fewer loop iterations or a smaller sketch that shows the same issue |
| Output is blocked | At least one translation error occurred | Select the source line beside an error, or download the review report for details |
| Output does not type correctly | Compiler, focus, layout or timing differs | Check PayloadStudio layout, application focus and startup waits |

## What is in the review report?

The JSON report includes your settings and the conversion result. The ok field indicates whether conversion succeeded. diagnostics lists errors and notices, and sourceMap links output instructions to sketch lines. stats.delayMs is the total programmed delay; for continuous loops, it covers setup and one iteration. Reports do not include partial output from a failed conversion.

## Reporting a problem

- Include a minimal, harmless sketch and exact converter version.
- Include your device, DuckyScript version, and conversion settings. Explain what you expected and what happened instead.
- Attach a redacted review report. Never include passwords, private endpoints or personal information.
- State whether the failure occurs during translation, destination compilation or physical-device testing.

Errors appear first, followed by review notices and other information. Select the line number next to a message to find it in your sketch, or open the linked guide. If conversion times out or cannot start, the message stays visible. Editing the sketch or changing a setting clears the previous output so you do not accidentally download an outdated result.

## Prepare a bug report

Select Prepare bug report to download a Markdown template with the version, browser information, and current conversion settings. It does not attach your sketch, output, or diagnostics, and it sends nothing automatically. Add the steps to reproduce the problem, your device and firmware, the keyboard layout, and what you expected. Review the file before sharing it with the maintainer. Select Report an issue on GitHub to open the public issue form. Nothing is submitted automatically.

> Download report is different: it contains the conversion result and may include text from your sketch. Remove private information before sharing it.

- [Report an issue on GitHub](https://github.com/TabGrinder/inoquill/issues/new?template=bug_report.yml)

