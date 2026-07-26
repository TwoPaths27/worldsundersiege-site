WORLDS UNDER SIEGE — MODULE 10 VALIDATION
==========================================

Module added
------------
card-data.js

Ownership moved into this module
--------------------------------
- Card and Unit entity factories
- External card-database lookup and path normalization
- Card/Unit construction from database entries
- Player Stronghold card metadata lookup
- Prototype starter-hand definitions
- Prototype starting-unit definitions

What remains in game-state.js
-----------------------------
- Board and priority constants
- Mutable GameState
- Runtime state lookup helpers

Load order
----------
card-database.js (external project-level database)
card-data.js
game-state.js
rules.js
audio.js
ui.js
animation.js
priority.js
battlefield.js
cards.js
match.js
game.js

Compatibility notes
-------------------
- Existing globals retain their original names, so downstream modules do not
  need behavior changes.
- Database-backed cards still use the same fallback data when the external
  card database is unavailable.
- The starting hands and battlefield setup are unchanged; only ownership of
  their definitions moved.

Validation performed
--------------------
- node --check on every JavaScript file
- node --check on the concatenated browser load order
- ownership audit confirming factories and starter definitions appear only in
  card-data.js
