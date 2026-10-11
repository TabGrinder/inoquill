# Browser and device acceptance

Record the tested Git commit, browser or compiler version, device firmware, operating system, keyboard layout, and date. An untested row stays Pending. Automated conversion success is not a device test.

## Browser checks

Use the published /inoquill/ URL in Chrome or Edge, Firefox and Safari, then mobile Chrome and Safari where available.

1. Import examples/semantic-smoke.ino as UTF-8. Confirm the filename and complete text. Try an invalid UTF-8 file; the current sketch must remain intact.
2. Select a device and convert. Confirm the expected text below, selected language, source trace and notices.
3. Copy output into a plain-text editor and compare it with the visible output. Deny clipboard access and check that the fallback selects the text.
4. Name and download the script. Compare file content with the visible output. Change the source or startup delay: copy/download must be disabled until reconversion. Blank or fractional startup delays must show a persistent error.
5. Load a different example, use Undo and confirm source and filename restoration. Import two files quickly and confirm the last selection wins.
6. Open Wiki, search for macro precedence, open a guide, then leave Wiki while it is loading. Navigation must stay on the selected tab.
7. Open the GitHub issue link without submitting anything. Download the bug-report template; it must contain settings but no sketch or output.
8. Check keyboard-only focus, both themes, 200% zoom, narrow layout, and browser console/network errors. Record failures with exact steps; do not mark these passed based on source inspection.

## Harmless device check

Use examples/semantic-smoke.ino. It only waits and types text. Convert with setup() only and no extra startup delay. Open an empty plain-text document on your own computer and keep it focused. Close terminals and administrative windows before connecting the device.

Expected lines:

```text
InoQuill check
2147483647
A
7
```

For the source sketch, compile with the actual DigiKeyboard library and board toolchain, then compare the text it types. For the destination:

| Device | Preparation |
| --- | --- |
| USB Rubber Ducky 2022 | Compile the 3.0 source with Hak5 PayloadStudio, choose the host layout, deploy the resulting inject.bin |
| Classic USB Rubber Ducky | Compile the 1.0 source with an encoder compatible with the installed firmware |
| Flipper Zero | Save the Flipper preset output under /badusb and select the matching layout |
| Bash Bunny | Load the 2.0 keystroke file through QUACK in a separately configured HID payload |
| Key Croc | Place the quoted QUACK snippet in a separately configured payload with an intentional trigger |

Follow each device's official instructions and the Output targets guide. No generated source is claimed to have been compiled by those tools or executed on these devices yet. After the text check, repeat with the supplied keyboard-punctuation example. Do not infer layout correctness from alphanumeric text alone.

## Result record

| Field | Result |
| --- | --- |
| Git commit / version | |
| Device / firmware / board library | |
| Compiler / encoder version | |
| Browser / OS / host keyboard layout | |
| Source and conversion settings | |
| Compilation result | Pending |
| Expected text vs actual text | Pending |
| Timing and keys released | Pending |
| Evidence and remaining issue | |
