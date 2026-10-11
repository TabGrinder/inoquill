# Key codes and modifiers

> InoQuill v1.0.0 by TabGrinder

Find the right key codes for DigiKeyboard and Arduino Keyboard.

> The HOLD/RELEASE example below targets DuckyScript 3.0. Portable 1.0 and 2.0 profiles convert immediate press/release sequences to taps or shortcuts. Delays while a key is held, overlapping chords, and standalone modifiers require manual adaptation.

The two libraries use different numbers for some keys. InoQuill checks whether a call uses DigiKeyboard or Keyboard before choosing the matching key code.

| Intent | DigiKeyboard | Arduino Keyboard |
| --- | --- | --- |
| Enter | KEY_ENTER or HID usage 40 | KEY_RETURN or 0xB0 |
| Lowercase r | KEY_R or HID usage 21 | 'r' or ASCII 114 |
| Left Control | MOD_CONTROL_LEFT mask (1) | KEY_LEFT_CTRL |
| Left Shift | MOD_SHIFT_LEFT mask (2) | KEY_LEFT_SHIFT |
| Left Alt | MOD_ALT_LEFT mask (4) | KEY_LEFT_ALT |
| Left GUI | MOD_GUI_LEFT mask (8) | KEY_LEFT_GUI |

## Send a key combination

```cpp
DigiKeyboard.sendKeyStroke(KEY_R, MOD_GUI_LEFT);
```

```text
GUI r
```

Combine modifier masks with the bitwise OR operator, |. InoQuill supports left-side modifiers with mask values from 0 to 15. A key value of 0 without modifiers sends no key. In the 3.0 profile, a modifier on its own uses INJECT_MOD.

## Hold and release keys

```cpp
Keyboard.press(KEY_LEFT_CTRL);
Keyboard.press('a');
delay(100);
Keyboard.releaseAll();
```

```text
INJECT_MOD
HOLD CTRL
HOLD a
DELAY 100
RELEASE a
INJECT_MOD
RELEASE CTRL
```

Pressing a key that is already held does not add another HOLD command. releaseAll releases keys in the reverse order they were pressed. If any keys remain held at the end, InoQuill releases them and adds a review notice. Printing text while holding keys is not supported because the result can depend on how the source library handles keyboard reports.

## Choose the keyboard layout

Use the keyboard layout configured on the computer that will receive the keystrokes. Your Arduino library may also have its own layout settings. InoQuill uses the documented default key mappings; it cannot read the library’s build settings or create layout files. Check punctuation and shortcuts when you test the script.

- [Arduino Keyboard source](https://github.com/arduino-libraries/Keyboard)
- [DigiKeyboard source](https://github.com/digistump/DigistumpArduino/blob/master/digistump-avr/libraries/DigisparkKeyboard/DigiKeyboard.h)
- [Hak5 held keys](https://documentation.hak5.org/hak5-usb-rubber-ducky/advanced-features/holding-keys)

## Check punctuation before using a script

Choose Check keyboard punctuation from Try an example. Convert it for your device, then use the device’s normal compilation or loading process. Open a blank text editor on a computer you own and compare the typed text with the example. Check symbols such as @, brackets, slashes, and question marks. This is a manual check of the keyboard layout; InoQuill does not remap layouts or verify the typed result.

