# Worlds Under Siege v18.7.4 — Layered Stack Render Hotfix

## Fixed

- Added the missing `getStackEntryTypeLabel()` helper used by layered full-card stack rendering.
- Prevents `ReferenceError: getStackEntryTypeLabel is not defined` during:
  - priority-window rendering,
  - stack entry creation,
  - card selection,
  - battlefield selection,
  - pass/full-control interactions.
- Added safe readable labels for actions, attacks, game events, triggers, activated abilities, movement, and generic effects.
- Unknown future stack types now receive a title-cased fallback instead of crashing the UI.

## Changed files

- `priority.js`
- `V18_7_4_LAYERED_STACK_RENDER_HOTFIX_NOTES.md`
