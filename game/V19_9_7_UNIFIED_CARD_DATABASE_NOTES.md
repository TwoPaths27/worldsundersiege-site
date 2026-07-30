# V19.9.7 — Unified Card Database

- Consolidated the authoritative card catalog into `game/card-database.js`.
- Added normalized aliases for attack/atk, health/hp, speed/spd, image/cardImage.
- Added indexed lookup by printed ID, gameplay ID, name, type, and Characteristic.
- Migrated card factories, deck loading, pregame loading, and card UI database access.
- Added startup validation for duplicate IDs/names, invalid types/stats/costs, and missing artwork metadata.
- Preserved compatibility globals while eliminating duplicate catalog snapshots.
- Removed the dependency on a separate parent-folder card database.

The remaining files (`card-data.js`, `card-types.js`, `abilities.js`, and `effects.js`) are engine/factory/rules modules, not competing card catalogs.
