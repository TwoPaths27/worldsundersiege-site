# Worlds Under Siege v16.2 Hotfix

## Fixed

- Fixed `ReferenceError: Cannot access 'canAttack' before initialization` in `createSelectedUnitControls()`.
- Renamed the local boolean to `attackAvailable`, preventing it from shadowing the global `canAttack()` capability helper.
- Unit selection no longer interrupts battlefield cell rendering or makes tiles disappear.
- Restored the priority panel to its intended position in the left sidebar, between Selected Unit and Game Chat.
- Removed the previous fixed-position bottom-center priority override.
- Increased the stylesheet cache-busting version to `v=32`.

## Validation

All JavaScript files pass `node --check`.
