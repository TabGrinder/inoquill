#include "DigiKeyboard.h"

void setup() {
  DigiKeyboard.delay(2000);
}

void loop() {
  DigiKeyboard.println("Hello from InoQuill!");
  DigiKeyboard.delay(500);
  DigiKeyboard.println("Arduino to DuckyScript");
}
