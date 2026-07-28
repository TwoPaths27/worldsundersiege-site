# Worlds Under Siege V19.9.2 — Deck & Draw UI

## Implemented

- Added authoritative 60-card prototype decks for both players.
- Deck counts now render from live zone state instead of static HTML values.
- The Draw Step now draws one card through the V19.9.1 Zone Engine.
- Attempting to draw from an empty Deck immediately ends the game by deck-out.
- Added a card movement animation from the active player’s Deck to the Hand.
- Hand rendering and card counts update immediately after every draw.
- Clicking a Deck shows its public count while keeping card identities hidden.
- Empty Deck piles receive a distinct visual state.
- Added reduced-motion support for the draw animation.

## Scope

This pass covers Deck state, automatic turn draws, count synchronization, and draw feedback. Public Discard and Banish browser windows are scheduled for V19.9.3.
