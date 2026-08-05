WORLD UNDER SIEGE — GLOBAL MOUSE CLICK SOUND

REQUIRED FILE
sounds/mouse-click.mp3

WHAT THIS FIX DOES
- Loads the click sound on every HTML page.
- Plays it for buttons, links, selectable controls, cards, packs, portraits, and other clickable game UI.
- Uses Web Audio for low-latency overlapping clicks.
- Falls back to a normal HTML Audio element if Web Audio is unavailable.
- Unlocks browser audio during the first user interaction.
- Supports keyboard activation with Enter or Space.
- Uses the exact case-sensitive path:
  sounds/mouse-click.mp3

FILE ADDED
- global-click-sound.js

ALL HTML PAGES WERE UPDATED TO LOAD IT.
