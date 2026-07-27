# Worlds Under Siege v18.2 — Turn-Step Priority Windows

## Added

The turn now progresses through real priority windows:

1. Beginning step
2. Draw step
3. Main step
4. End step

Both players receive priority in each window. Smart auto-pass from v18.1
continues to skip prompts when a player has no legal Action.

## End-turn behavior

The End Turn button no longer changes players immediately. It requests the
End step, opens priority, and changes the active player only after both players
pass and the Action stack is empty.

## Default phase stops

Beginning, Draw, Main, and End stops are enabled by default. A player is still
prompted only when they have a playable Action. v18.6 will add the on-screen
controls for toggling these stops.

## Draw step

The current project does not contain an implemented deck draw operation.
v18.2 creates the draw step, emits `drawStepStarted`, and opens its priority
window. A future deck implementation can attach the actual card draw to that
event without redesigning the turn controller.

## New helpers/events

- `openTurnStepPriorityWindow(step, options)`
- `beginTurnStepSequence(playerId)`
- `beginDrawStep(playerId)`
- `beginMainStep(playerId)`
- `requestEndStep()`
- `finalizeEndTurn(playerId)`
- `turnStepStarted`
- `turnStepEnded`
- `drawStepStarted`
- `mainStepReady`
