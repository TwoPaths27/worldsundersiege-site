Worlds Under Siege — Module 5: Match Controller

Load order:
1. card-database.js
2. game-state.js
3. priority.js
4. battlefield.js
5. cards.js
6. match.js
7. game.js

match.js owns:
- Match initialization
- Top-level renderGame orchestration
- End-turn validation and player switching
- End-of-turn temporary-effect cleanup
- Turn-start Energy, Speed, and attack refresh
- Match-level selection reset during turn changes

game.js still owns:
- DOM element lookup and validation
- Audio and ambience
- Global event binding
- Chat and modal controls
- Game-log rendering and shared formatting helpers
- The final initializeGame() bootstrap call

Automated validation:
- game-state.js: PASS
- priority.js: PASS
- battlefield.js: PASS
- cards.js: PASS
- match.js: PASS
- game.js: PASS
- combined load-order syntax: PASS

Behavior preserved:
- Existing render order is unchanged
- End Turn remains blocked during animations, priority, resolution, or a nonempty Action Stack
- Taking Aim bonuses expire for the player ending the turn
- The next player gains one maximum Energy (up to 10), refills Energy, refreshes Speed, and regains attacks
- Selection and targeting state are fully reset between turns
