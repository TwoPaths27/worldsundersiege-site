Worlds Under Siege — Module 6: UI Shell

Load order:
1. card-database.js
2. game-state.js
3. ui.js
4. priority.js
5. battlefield.js
6. cards.js
7. match.js
8. game.js

ui.js owns:
- Shared DOM element lookup
- Required-element validation
- Global event binding
- Stronghold pointer/focus/click bindings
- Chat submission and message rendering
- Exit modal controls
- Hand collapse toggle
- Escape and resize handlers
- Match log rendering and classification
- Shared addLog and coordinate formatting helpers

game.js now owns:
- Audio registries and playback helpers (scheduled for Module 7)
- One-line match bootstrap via initializeGame()

Automated validation:
- Every JavaScript file: PASS (node --check)
- Combined browser load order: PASS (node --check)

Behavior preserved:
- Match initialization and top-level rendering
- End Turn and priority controls
- Unit and Stronghold interactions
- Card selection and Action Stack
- Chat, hand toggle, exit/victory controls
- Match history rendering
- Existing audio hooks
