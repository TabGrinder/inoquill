#include <Keyboard.h>

void setup() {
  Keyboard.begin();
  if (digitalRead(2) == HIGH) {
    Keyboard.println("Sensor activated");
  }
}

void loop() {}
