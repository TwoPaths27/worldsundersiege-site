# Worlds Under Siege V19.9.6.1a

## Saved Deck Loader — Phase 1

Added `deck-loader.js` with browser-storage support for:

- `wus-saved-decks-v2`
- `wus-active-deck-v2`
- legacy v1 keys

Public API: `window.WUSDeckLoader`

- `getSavedDecks()`
- `getActiveSavedDeck()`
- `normalizeSavedDeck(deck)`
- `validateSavedDeck(deck)`
- `createRuntimeDeck(deck, playerId)`
- `applySavedDeckToPlayer(deck, playerId)`
- `loadSavedDeck(id, playerId)`
- `loadActiveDeck(playerId)`

Validation requires exactly 60 main-deck cards, exactly one Stronghold, and no more than three different Army cards. Runtime cards receive fresh IDs, owner/controller data, and are shuffled unless disabled by the caller.

The currently active Deck Builder deck is automatically imported for Player 1 before match initialization when it is valid. Prototype setup remains as the fallback.

## Coin Flip

Before gameplay initializes:

1. One player is randomly selected to call the coin.
2. That player chooses Heads or Tails.
3. The coin result is random.
4. The winner becomes the first active player and starts with 1 Energy.
