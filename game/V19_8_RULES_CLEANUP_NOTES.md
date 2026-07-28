# V19.8 Rules Cleanup & Edge Cases

## Added

- Central state-based action runner (`rules-cleanup.js`).
- Repeated lethal-damage cleanup for simultaneous deaths.
- Mount relationship validation and orphan-link repair.
- Automatic separation when rider and Mount no longer share a controller.
- Unit state normalization for HP, movement spent, concealment, and effective remaining Speed.
- Public `handleUnitControlChange()` helper for card effects.
- Construct Range and Conceal detection refresh after state-based changes.

## Fixed

- Conceal now recognizes the canonical `mountedOn` field.
- Concealing either half of a mounted pair clears both canonical attachment links.
- Mount legality and per-turn reset now use controller rather than printed owner.
- Mounted combat damage selection uses controller rather than owner.
- Mounted combat damage safely handles missing or malformed HP/Attack values.

## Engine API

- `runStateBasedActions(options)`
- `repairMountRelationships(options)`
- `validateMountedPair(character, mount)`
- `normalizeUnitState(unit)`
- `handleUnitControlChange(unit, newController, options)`
