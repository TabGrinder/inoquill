#include <Keyboard.h>

void setup() {
  Keyboard.begin();
  delay(2000);
  Keyboard.press(KEY_LEFT_CTRL);
  Keyboard.press('a');
  Keyboard.releaseAll();
  Keyboard.println("A reviewed keyboard sequence.");
  Keyboard.end();
}

void loop() {}
