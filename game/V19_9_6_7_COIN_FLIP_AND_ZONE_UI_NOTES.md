# V19.9.6.7 — Cinematic Coin Flip and Zone UI

## Coin flip
- Uses `logo.png` for both coin faces.
- Uses `sound/coin-flip.mp3` when the flip begins.
- Adds a 3D launch, spin, slowdown, landing bounce, shadow, and result glow.
- Determines the result before animation and lands on the correct face.
- Preserves the existing Heads/Tails and Play First/Play Second flow.
- Includes reduced-motion handling.

## Army preview
- Occupied Army slots now update Card Preview on mouse hover, keyboard focus, and click.
- Corrected the Army preview guard condition.
- Army preview continues to hide Cost.

## Zone layout
- Army, Deck, Discard, and Banish cards now use the same dimensions as Event cards.
- Discard is positioned above Deck.
- Banish is positioned beside Discard.
- Applied consistently to both players.

## Required existing assets
- `logo.png` in the game root.
- `sound/coin-flip.mp3` in the game root's `sound` folder.
