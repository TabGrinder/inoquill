#include "DigiKeyboard.h"
#define VALUE 1 + 2
void setup() {
  DigiKeyboard.delay(3000);
  DigiKeyboard.println("InoQuill check");
  uint32_t n = 4294967295;
  DigiKeyboard.println(n >> 1);
  char c = 'A';
  DigiKeyboard.println((c));
  DigiKeyboard.println(VALUE * 3);
}
void loop() {}
