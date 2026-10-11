# Control flow and scope

> InoQuill v1.0.0 by TabGrinder

Choose what happens to setup(), loop(), and repeated actions.

> For all three versions, InoQuill turns supported finite loops into repeated output commands. Repeating loop() continuously requires DuckyScript 3.0 and uses WHILE commands. Selecting an older version switches the loop option to One pass through loop().

## How setup() and loop() are handled

InoQuill translates setup() first. Variables declared inside setup() stay there; they do not become local variables in loop(). Supported changes to global values carry over into loop(). Helper functions can use global values and their own parameters, but not local variables from the calling function. Variable shadowing and static local variables are not supported.

| Mode | Behavior | Suitable for |
| --- | --- | --- |
| One pass through loop() | setup plus one loop iteration | Reviewing an initial translation |
| Repeat continuously | setup followed by WHILE TRUE / END_WHILE | A repeatable sequence with no evolving global state |
| setup() only | loop is excluded | Sketches that perform all intended actions in setup |

## How repeated actions are translated

```cpp
for (int i = 0; i < 3; i++) {
  Keyboard.println("Test");
  delay(100);
}
```

This example produces three copies of the text and delay commands. InoQuill evaluates if conditions during conversion. If a condition depends on a sensor reading or other information it cannot determine, conversion stops with an error.

## A few limits to keep in mind

- A continuous loop cannot change inherited global variables. Using only their initial values would make later repetitions behave differently from the sketch.
- Helper functions cannot change inherited global variables. Pass the values they need as arguments.
- Loop counters declared in for are scoped to that loop. break is valid only inside a loop.
- while(true) with no body is a halt on the source board; it is rejected rather than skipped.
- No variable updates are emitted as DuckyScript VAR operations. This release intentionally uses static evaluation.

> InoQuill may reject a short-circuit expression if part of it contains a value it cannot determine. It does not implement every C++ evaluation rule. Where appropriate, rewrite the condition using values known at conversion time.

