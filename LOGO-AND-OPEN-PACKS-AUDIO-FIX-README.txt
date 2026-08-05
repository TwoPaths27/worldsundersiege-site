DECK BUILDER LOGO + OPEN PACKS CLICK SOUND FIX

DECK BUILDER
- Forces the logo to 145px wide and no more than 54px tall.
- Adds an inline size safeguard so another stylesheet cannot enlarge it.
- Adds a cache-busting version to deck-builder.css.

OPEN PACKS
- Disables the generic UI click sound for the entire page.
- Removes the Open Packs internal global click listener.
- Removes the older Batch2 click listener.
- Removes the mouse-click.mp3 path from Open Packs code.
- Keeps dedicated booster, pack-opening, rarity, and card-flip sounds.
- Adds cache-busting script versions to prevent the browser using older JS.

FILES CHANGED
- deck-builder.html
- deck-builder.css
- open-packs.html
- open-packs.js
- global-click-sound.js
