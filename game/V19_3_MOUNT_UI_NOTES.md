# V19.3 — Mount UI and Battlefield Integration

- Mounted Characters no longer claim a separate battlefield cell; cell occupancy prefers the Mount.
- Mount tiles display a clickable rider badge.
- Clicking the rider badge selects the Character while retaining the shared Mount position.
- Added MOUNT and DISMOUNT controls to the selected-unit overlay.
- MOUNT highlights legal adjacent friendly Animals or Constructs with Mount.
- DISMOUNT highlights legal orthogonally adjacent empty spaces.
- Mount and dismount actions update the battlefield immediately and preserve the v19.2 movement state.
- Added battlefield styling for Mount targets, dismount spaces, and rider badges.

Combat damage redirection and Construct Range activation remain deferred to later passes.
