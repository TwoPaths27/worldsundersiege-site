# V19.9.6.4d — GameState Scope Fix

## Fixed

The saved-deck loader incorrectly checked `window.GameState`. The game declares
`GameState` with a top-level `const`, which is available to later classic scripts
but is not attached to `window`. This made both valid player IDs appear unknown.

The loader now resolves the lexical `GameState` binding first and falls back to
`window.GameState` only for compatibility.
