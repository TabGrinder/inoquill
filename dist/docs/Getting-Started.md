# Getting started

> InoQuill v1.0.0 by TabGrinder

Start with a simple greeting and review the result.

This example types a greeting into a text editor. When you are ready to test it on your device, open a blank document on a computer you own and keep that editor in focus.

## Find your way around the Workbench

- Follow the three steps above the editors: Add a sketch, Convert and review, Download your script.
- DuckyScript version and Device appear above the editors. Open About this DuckyScript version for details. After conversion, device instructions appear beside Prepare your download.
- Select Import sketch or Try an example above the editors, or paste your code into Arduino sketch.
- Click Convert sketch, then review DuckyScript output and the notices below the editors.
- Copy and Download script become available after a conversion without blocking errors. Use Source trace to inspect each instruction.
- The Wiki explains supported syntax, output targets and troubleshooting. Converted scripts and review reports can be downloaded from the Workbench.

> The example below uses DuckyScript 3.0. For another device, choose its preset first. Check Output targets for the file format and preparation steps.

## First sketch

```cpp
#include "DigiKeyboard.h"
void setup() {
  DigiKeyboard.delay(2000);
  DigiKeyboard.println("Hello from InoQuill!");
}
void loop() {}
```

## What the output looks like

```text
ATTACKMODE HID
DELAY 2000
STRING Hello from InoQuill!
ENTER
```

STRING types the greeting and ENTER starts a new line. The download also includes the converter version and, if selected, comments explaining the structure. This sketch already waits two seconds. Leave Extra startup delay at 0 unless you want to add more time.

## Prepare this example for your device

- Start with One pass through loop(), or choose setup() only if all the actions you need are in setup().
- Check any errors first. If a notice says that a board action was left out or a held key was released, make sure the result still matches your intent.
- Select Download script. For this 3.0 example, the filename ends in .ducky3.0.txt.
- For the USB Rubber Ducky (2022), open the script in PayloadStudio, choose your computer’s keyboard layout, and compile it. Test the resulting inject.bin with your own device. For other devices, follow Output targets and devices.

- [Hak5 PayloadStudio](https://payloadstudio.hak5.org/community/)

## Find a guide quickly

Search by topic, command, or a few words from your sketch. The search includes guide text, tables, and examples. Clear the search box to see all guides again.

Save your sketch as a UTF-8 text file before importing it. If the file uses another encoding, InoQuill asks you to save it as UTF-8 and try again. Files can be up to 200 KB (200,000 bytes).

## Recover a replaced sketch

Use Undo after clearing the editor, loading an example, or importing a file. It restores the previous sketch, its original filename, and your chosen download name. Up to five replacements are kept in memory until you reload or close the page. Undo does not change the selected device or conversion settings; convert again to check the restored sketch.

## Name your download

After a successful conversion, enter a name in Prepare your download. The filename below the field shows exactly what will be saved, including the DuckyScript version and .txt extension. Spaces and unsupported filename characters become hyphens.

Open Conversion options to change how loop() is handled, add a startup delay, or include explanatory comments. These options do not run your sketch.

