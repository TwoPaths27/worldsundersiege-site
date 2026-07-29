# V19.9.6.4g — Card Back Path Fix

- Added runtime discovery for `card-back.png`.
- Tries project-root, game-folder, and assets-folder locations.
- Uses one resolved image URL for both deck piles and draw animations.
- Adds a visible fallback instead of an empty deck if the file is missing.
- Logs the resolved path in the browser console.
