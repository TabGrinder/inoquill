// Device presets select a language profile and provide deployment guidance.
export const targets = [
  { id: 'rubber-ducky-2022', name: 'USB Rubber Ducky (2022)', language: '3.0', hint: 'Open the downloaded script in Hak5 PayloadStudio, choose the keyboard layout used by your computer, and compile it. Then copy inject.bin to your device.' },
  { id: 'rubber-ducky-classic', name: 'USB Rubber Ducky (classic)', language: '1.0', hint: 'Use an encoder for the classic USB Rubber Ducky to compile the downloaded text. Choose the keyboard layout used by your computer before creating inject.bin.' },
  { id: 'flipper-zero', name: 'Flipper Zero · BadUSB', language: '1.0', hint: 'Copy the downloaded .txt file to the badusb folder on your SD card. Open it in the BadUSB app and choose the keyboard layout used by your computer.' },
  { id: 'bash-bunny', name: 'Bash Bunny · QUACK file', language: '2.0', hint: 'The download contains keystrokes for QUACK. Load it from your Bash Bunny payload after enabling ATTACKMODE HID. You still need to prepare payload.txt separately.' },
  { id: 'key-croc', name: 'Key Croc · QUACK snippet', language: '2.0', hint: 'Add the downloaded QUACK commands to your Key Croc payload. Enable HID, set DUCKY_LANG for your computer, and configure the trigger in that payload.' },
  { id: 'generic', name: 'Other compatible device', language: null, hint: 'Choose a DuckyScript version supported by your device’s firmware, then check its documentation for supported commands and how to load the script.' }
];
export const languageHints = {
  '1.0': 'Types text, sends shortcuts, and adds delays. Supported finite loops become repeated commands. Continuous loops and timed key holds need manual changes.',
  '2.0': 'Exports the supported keyboard commands for Bash Bunny or Key Croc. Device setup, triggers, and other payload commands must be added separately.',
  '3.0': 'For the USB Rubber Ducky (2022). Supports held keys and continuous loops. Compile the downloaded script before loading it onto the device.'
};
