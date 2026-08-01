# V19.9.7.9 — Deck Search and Mounted Tile UX

- Added one reusable themed, scrollable, alphabetical Deck search browser.
- Sir Yvain now uses the shared browser and asks for confirmation after Lion is selected.
- Sir Yvain's controller chooses Lion's adjacent battlefield space directly on the board.
- Lion then enters that space and Sir Yvain mounts it automatically.
- Added a reusable `showDeckSearchModal()` / `searchDeckInteractive()` API for future Deck-search effects.
- Mounted pairs now fill the battlefield tile and split it in half:
  - left half selects/previews the rider;
  - right half selects/previews the Mount.
