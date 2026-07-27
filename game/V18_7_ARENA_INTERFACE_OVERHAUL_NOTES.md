# Worlds Under Siege v18.7 — Arena Interface Overhaul

## Summary

v18.7 replaces the large sidebar priority panel with a compact Arena-style
priority dock and moves the live stack onto the battlefield.

## Sidebar priority dock

- Added clickable `BS`, `DS`, `MS`, and `ES` phase-stop buttons.
- Blue buttons indicate enabled stops; dark buttons indicate auto-pass stops.
- Added a compact `AUTO` / `FULL` control.
- Replaced the large priority button with a compact `PASS` button.
- Added a short live status label such as `Your priority`, `Waiting`, or
  `Resolving stack`.
- Moved reaction stops into a gear popover.
- Kept the debug panel available inside that popover, hidden by default.
- Optional trigger decisions continue to appear as a compact prompt.

## Chat layout

- Removed the large permanent priority panel from the sidebar.
- The Game Chat panel now flexes into the recovered vertical space.
- Chat messages can use the remaining sidebar height instead of being cut off.

## Floating battlefield stack

- Removed the two narrow player-specific stack columns.
- Added one readable stack overlay on the battlefield.
- The overlay is invisible while the stack is empty.
- Entries display an effect icon, title, type, controller, and target/status.
- The top stack entry is visually emphasized.
- Hover and keyboard focus continue to preview sources and targets.
- Resolving and fizzled entries retain visual states.

## Compatibility

The priority and stack engines are unchanged. v18.7 is a UI/layout milestone
that reuses the v18.6 controls and v18.5 stack lifecycle.

## Changed files

- `index.html`
- `ui.js`
- `priority.js`
- `game.css`
- `V18_7_ARENA_INTERFACE_OVERHAUL_NOTES.md`
