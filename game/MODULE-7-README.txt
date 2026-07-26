WORLDS UNDER SIEGE — MODULE 7 REFACTOR
=======================================

Module introduced
-----------------
audio.js

Responsibilities moved out of game.js
--------------------------------------
- Audio object creation and configuration
- Gameplay sound-effect registry
- End-game sound registry
- Ambient audio startup
- One-shot playback
- Repeated playback
- Synchronized layered playback
- Browser audio priming

Bootstrap result
----------------
game.js now contains only the final initializeGame() call.

Updated browser load order
--------------------------
1. card-database.js
2. game-state.js
3. audio.js
4. ui.js
5. priority.js
6. battlefield.js
7. cards.js
8. match.js
9. game.js

Why audio.js loads before ui.js
-------------------------------
ui.js binds click and key listeners that call primeEndGameAudio(), playOneShot(),
and gameplayAudio. Loading audio.js first guarantees those shared names exist
before UI event binding begins.

Compatibility notes
-------------------
- Existing sound paths and volume levels were preserved.
- Existing public function and object names were preserved so battlefield.js,
  cards.js, and ui.js require no behavioral changes.
- Missing or blocked audio remains non-fatal.

Validation performed
--------------------
- node --check run for every JavaScript file
- Combined browser script order concatenated and checked with node --check
- Script order audited in index.html
- Audio symbol references audited across all JavaScript files

Result
------
All syntax and load-order validation checks passed.
