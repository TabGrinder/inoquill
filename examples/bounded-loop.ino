#include "DigiKeyboard.h"
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

void loop() {}
