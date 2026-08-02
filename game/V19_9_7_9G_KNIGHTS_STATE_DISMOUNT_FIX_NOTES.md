# V19.9.7.9g — Knight State, Mounted Kay, Sagremore, and Dismount Fix

- Fixed state-based lethal-damage checks to use the actual lexical GameState binding. Units at 0 HP or less are now destroyed after effect damage.
- Sir Kay remains active while mounted and measures range from the Mount's battlefield position.
- Sir Sagremore now explicitly plays the reveal activation flare and sound when his +1 SPD effect activates.
- Fixed Mount turn-reset logic so mountChangeUsed clears on the controller's next turn, allowing dismount on later turns.
- Updated cache versions for the affected scripts.
