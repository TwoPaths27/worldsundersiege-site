# V19.9.1 — Zone Engine

## Implemented

- Added authoritative per-player Deck, Hand, Discard, Banish, and Army Zone arrays.
- Added synchronized `deckCount`, `discardCount`, and `banishCount` values.
- Replaced the V19.9 stub with a centralized card movement API.
- Added zone ownership inference and compatibility with older `discardCard(card, from)` calls.
- Added public APIs for draw, multi-draw, discard, banish/exile, return to hand, top-deck, bottom-deck, and shuffle.
- Added card movement history, game-log entries, and `cardMoved`, `leftZone`, and `enteredZone` events.
- Added immediate deck-out defeat when a player attempts to draw from an empty Deck.
- Added zone validation and optional repair of card `zone` and `owner` metadata.
- Preserved `EXILE` as a compatibility alias that resolves to the public Banish Zone.

## Deliberately deferred

- Deck, Discard, and Banish browser UI.
- Army creation/Amass rules and the three-Army-type cap.
- Event Zone replacement UI and event-specific removal conditions.
- Card-effect parsing for search, mill, reveal, and recursion.
