export const examples = {
  layout: { name: "keyboard-check.ino", code: "#include \"DigiKeyboard.h\"\nvoid setup() {\n  DigiKeyboard.delay(3000);\n  DigiKeyboard.println(\"Keyboard check: ABC xyz 0123456789\");\n  DigiKeyboard.println(\"! @ # % & * ( ) - _ + = [ ] { } : ; , . / ?\");\n}\nvoid loop() {}" },
  digi: { name: 'hello.ino', code: `#include "DigiKeyboard.h"

void setup() {
  DigiKeyboard.delay(2000);
}

void loop() {
  DigiKeyboard.println("Hello from InoQuill!");
  DigiKeyboard.delay(500);
  DigiKeyboard.println("Arduino to DuckyScript");
}` },
  keyboard: { name: 'keyboard-shortcut.ino', code: `#include <Keyboard.h>

void setup() {
  Keyboard.begin();
  delay(2000);
  Keyboard.press(KEY_LEFT_CTRL);
  Keyboard.press('a');
  Keyboard.releaseAll();
  Keyboard.println("A reviewed keyboard sequence.");
  Keyboard.end();
}

void loop() {}` },
  loop: { name: 'bounded-loop.ino', code: `#include "DigiKeyboard.h"
#define WAIT 500
const int REPEATS = 3;

void typeLine(int pause) {
  DigiKeyboard.println(F("Conversion test"));
  DigiKeyboard.delay(pause);
}

void setup() {
  DigiKeyboard.delay(2000);
  for (int i = 0; i < REPEATS; i++) {
    typeLine(WAIT);
  }
}

void loop() {}` },
  spaces: { name: 'whitespace.ino', code: `#include <Keyboard.h>

void setup() {
  Keyboard.begin();
  delay(2000);
  Keyboard.print("  indented text  ");
  Keyboard.write(KEY_RETURN);
  Keyboard.print("column A\\tcolumn B\\n");
  Keyboard.println("A quote: \\\"hello\\\"");
}

void loop() {}` },
  longDelay: { name: 'long-delay.ino', code: `#include "DigiKeyboard.h"

void setup() {
  DigiKeyboard.delay(120000);
  DigiKeyboard.println("The two-minute wait is complete.");
}

void loop() {}` },
  invalid: { name: 'sensor-unsupported.ino', code: `#include <Keyboard.h>

void setup() {
  Keyboard.begin();
  if (digitalRead(2) == HIGH) {
    Keyboard.println("Sensor activated");
  }
}

void loop() {}` }
};
