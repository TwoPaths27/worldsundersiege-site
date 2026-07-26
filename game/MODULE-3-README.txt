Worlds Under Siege — Module 3: Battlefield

Load order:
1. card-database.js
2. game-state.js
3. priority.js
4. battlefield.js
5. game.js

battlefield.js owns:
- Battlefield and cell rendering
- Unit token rendering and selected-unit controls
- Unit/card selection and battlefield click handling
- Recruiting placement and related animations
- Movement and reachable-space calculation
- Attack targeting, protection rules, and combat resolution
- Unit/Stronghold attack previews and animations
- Selected Unit panel and shared card preview
- Stronghold rendering

Automated validation:
- game-state.js: PASS
- priority.js: PASS
- battlefield.js: PASS
- game.js: PASS
- combined: PASS

Key function declaration counts:
- renderBattlefield: 1
- createBattlefieldCell: 1
- createUnitToken: 1
- handleBattlefieldClick: 1
- selectUnit: 1
- recruitSelectedCard: 1
- clearSelection: 1
- moveSelectedUnit: 1
- findAttackableUnits: 1
- handleStrongholdClick: 1
- attackStronghold: 1
- attackUnit: 1
- findReachableSpaces: 1
- getOrthogonalNeighbors: 1
- renderSelectedUnitPanel: 1
- renderCardPreview: 1
- renderStrongholds: 1

Browser smoke test:
- Battlefield renders all 42 cells
- King Arthur and Guard render in their starting spaces
- Unit selection and Move/Attack controls work
- Legal movement and attack highlights appear
- Recruiting and placement animations work
- Unit attacks and Stronghold attacks resolve
- Taking Aim still uses the Action Stack and updates Range
- Card/Unit previews and selected-unit panel render
- End Turn and victory flow still work
