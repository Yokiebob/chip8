# chip8
Another Chip8 interpreter!

## Structure
Whole thing is contained in a class called "Chip8".

### Static
Utilities:
  Combine instructions:
    This function takes in two numbers and puts them together using bitwise OR. The Chip8 interpreter does this because instructions are actually two consecutive 8 bit numbers.
  Default Memory:
    This function has no arguments and returns a new Uint16Array that has the font values already in. Useful for resetting the vm.
  Lerp:
    Interpolates linearly between two numbers.
Constants:
  KeyMap:
    This array maps out the keys so you can use the vm like the old Cosmac VIP. More detail in the section about the key map.
### Inherited properties
  Keys:
    This Object contains the keyPresses made by the user on the window.
  Memory:
    Uint16Array containing all the memory. Not ROM, more like RAM.
  Display:
    Width:32
    Height:64
    Buffer:
      A Uint16Array containing all of the state of the display. Should only contain on or off.
    Out Buffer:
      An array of numbers that "lerp" to the display to give it a smooth effect and to reduce flickering.

TODO: Finish readme
