# Worlds Under Siege V19.9.5 — Event Zone

## Rules implemented

- Only Event cards use the Event Zone.
- Each player controls no more than one Event at a time.
- Events are public and can be inspected by clicking their Event Zone.
- A newly played Event resolves before the one-Event limit is applied.
- If its controller already has an Event, that player chooses which Event remains.
- The Event not kept goes to its owner's public Discard pile by default.
- A Countered or otherwise unresolved Event never creates a replacement choice.
- Events can define individual removal conditions through
  `registerEventRemovalCondition(event, predicate, options)`.
- `checkEventRemovalConditions(context)` evaluates those conditions and removes
  matching Events.

## Engine/API additions

- `getControlledEvent(playerId)`
- `playEventCard(card, playerId)`
- `removeEventFromPlay(event, options)`
- `completeEvent(event, options)`
- `registerEventRemovalCondition(event, predicate, options)`
- `checkEventRemovalConditions(context)`
- Event lifecycle history in `GameState.eventHistory`

## Fixes

- Fixed the recursive `clearEventInteractionState()` implementation.
- Event replacement now updates real Discard arrays and synchronized counts.
- Event zone movement is recorded by the shared Zone Engine.
- Event permanents now enter the canonical `event` zone rather than the generic
  battlefield zone.
