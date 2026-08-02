# Worlds Under Siege Mobile Route

This directory adds a separate mobile presentation route without modifying the desktop route.

- Desktop remains: `/game/`
- Mobile is: `/game/mobile/`

`mobile/index.html` uses `<base href="../">`, so it loads the same engine, card database, rules, effects, sounds, and desktop DOM from `/game/`. It then loads only `mobile/mobile.css` and `mobile/mobile.js` to provide a touch-focused presentation.

Implemented mobile phases:

1. Separate route and separate CSS/JS; no desktop files changed.
2. Shared normal game bootstrap with mobile enhancements applied afterward.
3. One-finger board pan, two-finger pinch zoom, board centering, and double-tap reset.
4. Fixed mobile toolbar with End Turn, Chat, Unit/Card, center, and Exit controls.
5. Chat drawer with unread badge.
6. Selected-unit/Card Preview drawer; Game Log omitted from mobile.
7. Swipeable mobile hand.
8. Tap a battlefield Unit and choose Expand to view its artwork.
9. Phone-sized scrollable game dialogs and safe-area support.
10. Fail-safe: if mobile enhancement fails, the shared standard interface remains instead of a blank battlefield.

Deploy the entire project and visit `/game/mobile/` on a phone. Do not overwrite `/game/index.html` with the mobile index.

## V19.9.7.10c mobile-only layout pass

- Unlocks and resumes `ambience.mp3` on the first phone touch/click, working around mobile autoplay restrictions.
- Fits the battlefield to nearly the full screen width instead of fitting the entire desktop stage.
- Reflows the mobile-only zone layout: Stronghold centered below the board, Energy directly underneath, and player Event/Armies/Deck/Discard/Banish grouped below the board toward the left.
- Simplifies the top bar to Exit, title, Chat, and a full-width End Turn row.
- Replaces the temporary center-screen Expand control with a `Zoom Card` button immediately below the top bar.
- No desktop files are modified.
