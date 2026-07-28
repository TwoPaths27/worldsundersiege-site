# V19.9.6.4b — Startup Timeout Fix

## Fixed

- Removed the 10-second timeout from all player-controlled startup dialogs.
- The deck lobby, coin flip, first-player choice, and mulligan phase may now remain open until a player makes a choice.
- Added explicit startup dependency checks and phase logging.
- Added Start Match click logging, double-click protection, and an in-progress state.
- Updated script cache-busting versions in `index.html`.

## Root cause

The diagnostics build treated the deck-selection lobby as a background operation and rejected it after ten seconds. Since deck selection is a user-controlled interaction, taking longer than ten seconds caused a false `Lobby timeout` even when the button and lobby code were healthy.
