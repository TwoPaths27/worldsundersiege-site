# Worlds Under Siege — v14 Part 4

## Card Type, Trait, and Capability Engine Migration

### Added
- `card-types.js` as the central, dependency-free card model module.
- Canonical card types: Character, Army, Animal, Construct, Item, Event, Action, Stronghold, plus legacy Unit compatibility.
- Multi-type normalization through `card.types` while retaining `card.type`.
- Trait API: `getTraits`, `hasTrait`, `addTrait`, and `removeTrait`.
- Capability API and defaults: attack, use Actions, equip Items, and operate Constructs.
- Runtime capability overrides: grant, revoke, and clear override.

### Integrated
- Starting hands and starting battlefield units are normalized during `GameState` creation.
- Action detection in `cards.js`, `battlefield.js`, and ability auditing now uses `isAction()`.
- Recruiting uses `isUnit()` instead of hard-coded Unit/Character strings.
- The default Action User validator now checks `canUseActions()`.
- Attack target generation and battlefield attack controls now check `canAttack()`.
- Recruited battlefield objects preserve types, traits, capabilities, and overrides.
- `index.html` loads `card-types.js` before game state and bumps modified module versions.

### Compatibility
- Existing cards with only `type` or battlefield objects with only `cardType` continue to work.
- Generic legacy `Unit` cards remain recruitable and able to attack.
- Existing ability definitions can still provide custom User validators, enabling card-specific exceptions.

### Validation
- Every JavaScript file in this package passes `node --check`.

## Progress

### Completed
- v13 integrated effects, replacement, zones, costs, and targeting foundations.
- v14 centralized type architecture.
- v14 multi-type support.
- v14 trait architecture.
- v14 capability defaults and runtime overrides.
- v14 initial engine migration for Actions, recruiting, and attacking.

### Remaining
- Complete migration of card creation/import paths once all card-data sources are included.
- v15 Construct operation, adjacency, and Character attack consumption.
- v16 Item attachment, equipment restrictions, and host cleanup.
- v17 persistent Event control and replacement choice.
- v18 Stronghold abilities and shared engine hooks.
- Individual card implementation, UI polish, AI, testing, and balancing.
