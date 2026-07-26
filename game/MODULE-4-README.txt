Worlds Under Siege — Module 4: Cards

Load order:
1. card-database.js
2. game-state.js
3. priority.js
4. battlefield.js
5. cards.js
6. game.js

cards.js owns:
- Active-player hand rendering
- Hand-card creation and card hover previews
- Card selection and deselection
- Action-card User/target selection state
- Action commitment to the Action Stack

Boundary cleanup in this pass:
- clearSelection() now lives in battlefield.js because it clears both Unit and card interaction state and is also used by battlefield and global keyboard behavior.
- Character cards now receive recruiting-space previews, matching recruitSelectedCard(), which already accepts both Unit and Character cards.
- Action-selection transient state is cleared consistently when the global selection is cleared.

Automated validation:
- game-state.js syntax: PASS
- priority.js syntax: PASS
- battlefield.js syntax: PASS
- cards.js syntax: PASS
- game.js syntax: PASS
- combined load-order syntax: PASS

Key declaration counts:
- function renderHand: 1
- function createHandCard: 1
- function selectCard: 1
- function commitSelectedAction: 1
- function clearSelection: 1 (battlefield.js only)
