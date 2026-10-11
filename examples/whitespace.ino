#include <Keyboard.h>

void setup() {
  Keyboard.begin();
  delay(2000);
  Keyboard.print("  indented text  ");
  Keyboard.write(KEY_RETURN);
  Keyboard.print("column A\tcolumn B\n");
  Keyboard.println("A quote: \"hello\"");
}

void loop() {}
