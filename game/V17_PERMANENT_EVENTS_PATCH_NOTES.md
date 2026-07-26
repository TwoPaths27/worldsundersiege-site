# Worlds Under Siege v17 — Permanent & Persistent Events

## Implemented
- Added `permanent.js` shared lifecycle abstraction.
- Added generic registration and cleanup of triggers, replacement effects, and continuous/static effects.
- Added `validator.js` development checks.
- Added `event-controller.js` with one persistent Event slot per player.
- Events are free to play and persist until completed, destroyed, or replaced.
- Playing a second Event asks which Event to keep; the other is discarded.
- Added Event and generic Permanent lifecycle events.
- Added Event state to `GameState`.
- Hand rendering identifies Events as free and avoids Unit-stat text.

## Partial / remaining
- Dedicated Event battlefield UI slots and artwork.
- Non-modal replacement-choice panel (current implementation uses a browser confirmation dialog).
- Migration of every existing Unit and Item entry/exit path to the Permanent API.
- Stronghold instances and ability registration through Permanent.
- Card-specific Event definitions and completion conditions.
- Automated browser gameplay tests.
