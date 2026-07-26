Worlds Under Siege — Module 2: Priority

Load order:
1. card-database.js
2. game-state.js
3. priority.js
4. game.js

priority.js owns:
- Priority-window opening, passing, resolving, and closing
- Pending-event storage and resumption
- Action effect resolution
- Taking Aim resolution feedback
- Action Stack rendering and hover preview
- Action-to-User arrow rendering

Validation:
- game-state.js: PASS
- priority.js: PASS
- game.js: PASS
- combined: PASS

Function declaration counts:
- beginPriorityWindow: 1
- openPriorityWindow: 1
- passPriority: 1
- beginResolveTopAction: 1
- closePriorityWindow: 1
- setPendingEvent: 1
- clearPendingEvent: 1
- resumePendingEvent: 1
- hasPriority: 1
- getPriorityPlayerId: 1
- getPriorityReason: 1
- isResolvingActionStack: 1
- resolveActionEffect: 1
- resolveTakingAim: 1
- showUnitActionFeedback: 1
- renderActionStacks: 1
- renderActionStackForPlayer: 1
- renderActionArrows: 1

Browser smoke test:
- Battlefield renders
- Units select, move, and attack
- Recruiting works
- Taking Aim enters the Action Stack
- Both players can pass priority
- Taking Aim resolves and grants +2 Range
- Stack hover preview and arrows render
- End Turn works after the stack is empty
