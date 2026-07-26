WORLDS UNDER SIEGE — MODULE 8 VALIDATION
========================================

Module added
------------
rules.js

Responsibilities moved into Rules
---------------------------------
- line-of-sight protection checks
- attackable Unit discovery
- attackable Stronghold discovery
- retaliation eligibility
- simultaneous Unit combat damage
- Unit destruction and discard-count updates
- Stronghold damage and destruction result
- temporary Range bonus application

Responsibilities intentionally left elsewhere
---------------------------------------------
- battlefield.js: input, selection, animation, audio, and combat presentation
- priority.js: priority windows, stack flow, and visual feedback
- match.js: turn lifecycle and match orchestration
- game-state.js: state shape, factories, and lookup helpers

Compatibility notes
-------------------
- Existing global function names were retained, so callers require minimal change.
- Combat still applies damage simultaneously before either Unit is removed.
- Retaliation still occurs when the incoming attack is lethal.
- Stronghold victory behavior and end-game presentation are unchanged.

Load order
----------
card-database.js
game-state.js
rules.js
audio.js
ui.js
priority.js
battlefield.js
cards.js
match.js
game.js

Validation performed
--------------------
- node --check on every JavaScript module
- concatenated browser load-order syntax check
- duplicate rules-function ownership audit
