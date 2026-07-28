# Worlds Under Siege — V19.9.4 Army Zone

## Rules implemented

- Only Army cards may be deployed to the Army Zone.
- Each player may control no more than three different Army types.
- Each Army type has an unlimited numerical amount.
- Amassing an existing Army type increases that Army instead of creating a duplicate slot.
- An Army whose amount is reduced to zero leaves the Army Zone by default.

## Engine API

- `amassArmy(playerId, armyCardOrType, amount, options)`
- `deployArmyCard(card, playerId, options)`
- `findArmyEntry(playerId, armyType)`
- `reduceArmy(playerId, armyType, amount, options)`
- `MAX_ARMY_TYPES` is set to `3`.

`deployArmyCard()` validates the Army card type, removes the card from its current zone, creates or grows the matching Army, records the zone move, and rolls back if deployment fails.

## Interface

- The three Army slots now render live Army state.
- Occupied slots show the Army type and its current amount.
- Clicking an occupied Army shows it in Card Preview.
- Army growth receives a brief visual pulse.
- Empty Army slots are clearly marked and are non-interactive.
