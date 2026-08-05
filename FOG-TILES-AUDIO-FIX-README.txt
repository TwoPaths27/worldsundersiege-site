FOG, TILE, AND AUDIO SETTINGS FIX

TILES
- Uses the actual singular folder: tile/
- Includes the 12 tile files from the uploaded ZIP.
- Adds tile-manifest.js so the browser only requests tiles that truly exist.
- King Arthur SD1 uses BOA-226 King Arthur.jpg.
- Dracula SD1 uses BOA-227 Dracula.jpg.
- Tarzan currently falls back directly to card artwork because no Tarzan tile exists.
- Missing tiles no longer cause repeated requests across several guessed folders.

FOG AND EMBERS
- Fixed the stacking order that placed fog behind the page background.
- Fog now remains behind all text, buttons, cards, boxes, and dialogs.
- Added subtle rising ember particles.

AUDIO
- Main menu music default reduced from 22% to 17%.
- Existing stored menu volume is reduced once to about 75% of its previous value.
- Added Sound Effects Volume to Settings.
- Sound Effects defaults to 100% for new players.
- Global mouse-click.mp3 follows the Sound Effects Volume setting.
- Fixed negative menu volume values during fades.

FILES ADDED
- tile-manifest.js
- tile/ folder with currently available tiles

FILES CHANGED
- index.html
- hub.js
- fog.css
- fog.js
- global-click-sound.js
