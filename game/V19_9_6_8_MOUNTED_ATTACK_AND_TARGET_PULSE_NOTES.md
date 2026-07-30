# V19.9.6.8 — Mounted Attack Animation & Target Pulse

## Mounted combat animation

Mounted Characters are rendered inside their Mount's battlefield token. Combat animation lookup now resolves a mounted rider to the complete mounted-pair token, so the Character and Mount lunge together during attacks and Stronghold attacks. The same lookup is used for retaliation and destruction animations.

## Enemy attack target feedback

Legal enemy attack tiles now continuously pulse between translucent and strongly illuminated red states. Hovering retains the stronger existing attack preview animation.

## Cache refresh

Updated the `game.css` and `battlefield.js` cache versions in `index.html`.
