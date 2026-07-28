# v18.9 Conceal — Pass 2

Implemented:

- Automatic reveal whenever a concealed unit is within the effective Range of an enemy unit.
- Repeat-until-stable detection, allowing a revealed unit's restored Range to reveal additional concealed units.
- Detection checks after movement, deployment, turn changes, Range changes, and units leaving play.
- `unitRevealed` now fires for both face-up deployment and concealed-to-revealed transitions.
- Concealing a unit destroys all Items attached to it through the normal Item destruction pipeline.
- Generic Mount separation support. Mounted relationships are cleared; the partner is placed in an adjacent open square. If no square is open, it is destroyed.
- Conceal and reveal lifecycle events (`unitConcealed`, `unitRevealed`).

Mount data did not yet have a single established schema in this build, so the helper recognizes common fields (`mountedUnitId`, `mountId`, `riderId`, `mountedToId`). When the dedicated Mount mechanic is implemented, it should call `separateMountedUnitForConceal()` or use those fields consistently.

When several adjacent Mount spaces are legal, the engine currently uses deterministic board order unless a caller provides `chooseMountSpace`. A dedicated player-choice UI can be connected later without changing the conceal rules.
