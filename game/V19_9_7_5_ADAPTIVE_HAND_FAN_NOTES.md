# V19.9.7.5 — Adaptive Hand Fan

## Changes

- Replaced fixed negative-margin hand spacing with a measured adaptive layout.
- Cards retain normal spacing while the hand fits comfortably.
- As cards are added, the horizontal step automatically contracts so the first and last cards remain inside the hand panel.
- Added a subtle compression-based fan rotation and arc.
- Kept hovered, keyboard-focused, and selected cards raised above the stack.
- Added automatic recalculation after hand renders, window resizes, and hand-panel size changes through `ResizeObserver`.
- Added reduced-motion handling and narrower-screen hover behavior.
- Updated `cards.js` and `game.css` cache versions in `game/index.html`.

## Validation

- `node --check game/cards.js`
- Layout safely handles one card, normal hands, compressed hands, and extremely large hands (step may reach zero rather than overflow).
