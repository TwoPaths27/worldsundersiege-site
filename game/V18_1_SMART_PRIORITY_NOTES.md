# Worlds Under Siege v18.1 — Smart Priority and Auto-Pass

## Added
- Per-player priority settings with Full Control, phase stops, and reaction stops.
- Explicit priority state-machine labels while preserving the existing `active` and `resolving` API.
- Legal Action inspection that checks Energy, registered ability, legal User, and legal target availability.
- Smart auto-pass when a player has no playable Action or has disabled the matching stop.
- Public helpers: `playerHasPlayableAction`, `getPlayableActions`, `setFullControl`, and `setPriorityStop`.

## Deliberately deferred
- Beginning/Draw/Main/End phase windows (v18.2).
- Pending attack response windows (v18.3).
- Post-movement response windows (v18.4).
- Full Action/ability priority reopening audit (v18.5).
- Arena-style stop controls and Full Control UI (v18.6).
