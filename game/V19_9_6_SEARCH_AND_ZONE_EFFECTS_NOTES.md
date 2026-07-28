# Worlds Under Siege — V19.9.6 Search & Zone Effects

## Added

- `zone-effects.js`, a reusable effect layer built on the authoritative Zone Engine.
- Deck searching with filters, player/card selection callbacks, destination control, and optional shuffle.
- Top-of-Deck reveal tracking and helpers for moving revealed cards.
- Milling from Deck to Discard or another requested public zone.
- Generic movement of selected cards between supported zones.
- Recovery from Discard and Banish.
- Chosen or random discard from Hand.
- Banish-from-zone helpers.
- Top- and bottom-of-Deck reordering.
- Object filters for card ID, name, type, keyword, and cost range.
- Zone-effect events: `deckSearched`, `cardsRevealed`, `cardsMilled`, `cardsDiscarded`, and `deckReordered`.

## Rules preserved

- Searching does not cause a deck-out loss; only attempting to draw from an empty Deck does.
- Discard and Banish remain public zones.
- All actual card movement passes through `moveCard()` so zone history and movement events remain authoritative.
- Deck searches shuffle afterward by default unless the resolving effect explicitly says not to.

## Public API

- `searchDeck(player, options)`
- `revealCardsFromDeck(player, amount, options)`
- `moveRevealedCards(cards, player, destination, options)`
- `millCards(player, amount, options)`
- `moveCardsFromZone(player, from, to, options)`
- `recoverFromDiscard(player, options)`
- `recoverFromBanish(player, options)`
- `discardFromHand(player, options)`
- `banishFromZone(player, from, options)`
- `reorderDeckCards(player, cards, location, options)`
