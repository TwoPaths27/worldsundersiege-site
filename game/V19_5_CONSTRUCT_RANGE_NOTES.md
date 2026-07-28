# Worlds Under Siege v19.5 — Construct Range Activation

## Rule implemented
A Construct's Range is active only while a face-up Character controlled by the same player occupies an orthogonally adjacent battlefield space.

- A concealed Character does not activate Construct Range.
- A Character sharing a Construct Mount's square does not count as adjacent.
- A mounted Character can activate a different Construct when the mounted pair's square is adjacent to that Construct.
- Constructs retain their printed/current Range values; their effective Range becomes 0 while inactive.

## Engine integration
- Added `construct-range.js` as the single source of truth for Construct Range activation.
- `getEffectiveRange()` now applies Construct activation after Conceal's Range 0 rule.
- Conceal detection therefore uses live Construct Range and supports reveal chains.
- Activation uses controller first and owner as fallback, so control-changing effects are respected.
- `refreshConstructRanges()` is available to effects that relocate units or change control outside the normal movement/deployment pipelines.

## Public helpers
- `hasAdjacentFriendlyCharacter(construct)`
- `getAdjacentFriendlyCharacters(construct)`
- `isConstructRangeActive(construct)`
- `getConstructAdjustedRange(unit, baseRange)`
- `refreshConstructRanges(options)`
