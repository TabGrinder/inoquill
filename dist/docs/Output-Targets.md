# Output targets and devices

> InoQuill v1.0.0 by TabGrinder

Choose a DuckyScript version and prepare the download for your device.

Choose your device first. InoQuill selects its DuckyScript version and shows how to prepare the download. You can also choose a version directly; the device selection will update to match. Select Other compatible device if you need to choose the version yourself.

| Language | Presets | Preparation |
| --- | --- | --- |
| DuckyScript 1.0 | Classic USB Rubber Ducky; Flipper Zero | Classic: compile with a compatible encoder/layout. Flipper: copy the .txt file to /badusb and open it in BadUSB. |
| DuckyScript 2.0 | Bash Bunny; Key Croc | Bash Bunny: QUACK-loadable keystroke file. Key Croc: quoted inline QUACK snippet. Configure HID, keyboard layout, and triggers separately. |
| DuckyScript 3.0 | USB Rubber Ducky (2022) | Compile source in Hak5 PayloadStudio with the host layout and deploy inject.bin. |

## What each version supports

- All three versions support text, keyboard shortcuts, delays, and finite loops that InoQuill can expand into individual commands.
- The 3.0 profile adds ATTACKMODE HID. It can use WHILE for continuous loops, HOLD and RELEASE for held keys, and INJECT_MOD for modifiers sent on their own.
- The 1.0 and 2.0 profiles leave out commands specific to 3.0. A key press followed immediately by a release can become a tap or shortcut. A notice explains the change.
- The 1.0 and 2.0 profiles cannot translate continuous loops, timed key holds, overlapping key combinations, or modifiers sent on their own.
- The 2.0 profile exports keyboard commands, not a complete device payload. Bash Bunny receives a keystroke file to load with QUACK. Key Croc receives inline QUACK commands with quoted text arguments.

## Load a script on Bash Bunny

Save the exported file as keystrokes.txt in switch1. In a separate device payload, enable HID and load the file. Confirm paths and layout against the installed firmware documentation.

```sh
ATTACKMODE HID
QUACK switch1/keystrokes.txt
```

> Bash Bunny receives a keystroke file; Key Croc receives QUACK commands with quoted STRING arguments. You still need to configure the device payload and its trigger. These downloads are intended for the device, not for direct use in a computer’s shell. Digispark sketches can be used as input, but a stock Digispark cannot run the downloaded DuckyScript files.

## Delays and timing

InoQuill splits long waits into DELAY commands of up to 65,535 ms, or 10,000 ms in the 2.0 profile. The total stays the same. These limits apply to InoQuill’s output; other tools may use different limits. In the 3.0 profile, each positive delay must be at least 20 ms. For example, a 65,536 ms wait becomes 65,516 ms plus 20 ms. The 1.0 and 2.0 profiles accept positive whole-number delays. A zero delay produces no command.

> Delay values can range from 0 to 4,294,967,295 ms. Very large values may still exceed the output or processing limits. The displayed total includes delays only; typing and USB communication take additional time. Test the timing on the computer and device you plan to use.

- [Hak5 language history](https://shop.hak5.org/pages/duckyscript-3-0)
- [Hak5 delay semantics](https://documentation.hak5.org/hak5-usb-rubber-ducky/ducky-script-basics/delay)
- [Bash Bunny QUACK](https://documentation.hak5.org/bash-bunny/writing-payloads/quack)
- [Flipper BadUSB file format](https://developer.flipper.net/flipperzero/doxygen/badusb_file_format.html)

- [Key Croc DuckyScript 2.0 and QUACK limits](https://documentation.hak5.org/key-croc/writing-payloads/the-quack-command)

