# Worlds Under Siege v18.6 — Arena UI & Priority Controls

## Added

- Player 1 Full Control toggle, with Ctrl/Cmd+F shortcut.
- Expandable phase and reaction stop controls.
- Expandable live priority debugger.
- Priority-panel visual pulse while Player 1 has priority.
- `createStackViewModel()` to separate stack rendering data from raw engine entries.
- Stack cards now identify entry type, controller/user, target, and status.
- Hover/focus stack previews highlight source and target Units or Strongholds.
- Resolving stack entries receive a visible resolution animation.

## Stop controls

The panel exposes Beginning, Draw, Main, End, Recruit, Movement, Attack,
Damage, Action, Trigger, Ability, and End Turn stops. Full Control overrides
individual stop settings without deleting their saved values.

## Debug panel

The panel displays priority state, current priority player, reason, stack size,
pending event type, and consecutive pass count.

## Scope note

Existing simultaneous-trigger ordering remains deterministic through the
current trigger queue and LIFO stack. A modal drag-and-drop ordering interface
was not added because the current engine does not yet expose a safe reorder
transaction for unresolved simultaneous triggers.
