# V19.9.6.2 — Pre-Game Lobby

## Added

- A blocking pre-game deck-selection lobby before the coin flip.
- Player 1 can select any valid saved deck.
- When no valid saved deck exists, Player 1 receives the Prototype Deck fallback.
- Player 2 can select a valid saved deck or the Prototype Deck.
- Live deck summaries show deck size, Stronghold, Army selections, and validation state.
- Invalid saved decks remain visible for diagnosis but cannot be selected.
- Start Match remains disabled until both selections are legal.
- Cancel returns to the project home page.

## Match flow

1. Choose Player 1 and Player 2 decks.
2. Apply fresh runtime card instances and shuffle saved decks.
3. Run the random caller Heads/Tails coin flip.
4. Initialize the match with the coin-flip winner as first player.

## Files

- Added `pregame-lobby.js`.
- Updated `index.html`.
- Updated `game.js`.
- Updated `game.css`.
