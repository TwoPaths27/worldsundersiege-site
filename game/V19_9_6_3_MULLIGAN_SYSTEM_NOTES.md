# V19.9.6.3 — Mulligan System

## Match-start sequence

1. Both players select decks.
2. A random player calls Heads or Tails.
3. The coin-flip winner chooses to play first or second.
4. Both players draw six cards.
5. Player 1 chooses Keep or Free Mulligan.
6. Player 2 chooses Keep or Free Mulligan.
7. The selected first player's first turn begins.

## Mulligan rule

- Each player receives one free mulligan opportunity per game.
- A mulligan returns the entire six-card opening hand to the Deck, shuffles, and draws six new cards.
- There is no hand-size penalty.
- The new hand is final; no second mulligan is offered.

## Runtime state

Each player tracks `usedMulligan`, `mulliganDecisionMade`, and `mulliganAvailable`.
The game also tracks `firstPlayerId` and `openingHandPhase`.
