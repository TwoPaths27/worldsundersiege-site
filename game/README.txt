Worlds Under Siege — Commit 1 inspection wiring

Files:
- battlefield.js
- game-state.js

Implemented:
- Independent inspectedUnitId state
- Enemy click inspection without clearing friendly selection
- Friendly selection also updates inspection
- Selected-unit panel and card preview inspection fallback
- is-inspected-unit and cell-inspected CSS hooks
- Inspection cleared at match end
- Surviving defender inspected after combat
- Stale inspected unit IDs self-clear when resolved

Both JavaScript files pass node --check.
