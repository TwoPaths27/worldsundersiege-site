# V19.9.7.8a — Knights GameState Scope Fix

- Fixed BOA-010 Sir Sagremore end-turn enforcement crashing when `GameState` is a global lexical binding rather than a `window` property.
- Added a safe GameState resolver used by the BOA-004 through BOA-010 card module.
- Updated the Knights script cache version.
