# Worlds Under Siege — Integrated Engine Patch v13

This patch integrates the v13 engine foundations into the current v12 codebase.

## Added modules
- effects.js: continuous effects, modifier layers, derived attack/range/speed/max HP, statuses, expiration
- zones.js: adapter for hand, stack, battlefield, discard, and exile movement
- costs.js: cost validation/payment and rollback-capable transactions
- targeting.js: generic target request lifecycle
- replacement.js: replacement and prevention effects before event dispatch

## Integrated behavior
- index.html loads all v13 modules in dependency order
- GameState initializes all new engine collections
- emitGameEvent() applies replacement/prevention effects before queueing events
- combat reads derived attack and range
- stunned/frozen units cannot generate attack targets
- Taking Aim uses a continuous effect that expires at end of turn
- recruited units receive normalized base stats and battlefield zone metadata
- Action cards receive stack/discard zone metadata
- resolved Actions are stored in the owning player's discard collection
- end-turn cleanup expires continuous effects/statuses
- unit destruction removes source-bound replacement effects and expires source-bound effects
- turn refresh reads derived speed
- pending generic target requests are cleared with match selection

## Stack ordering
The Action Stack remains strict LIFO. No player-controlled stack ordering was added.

## Validation
All JavaScript files in this package were checked with `node --check`.
