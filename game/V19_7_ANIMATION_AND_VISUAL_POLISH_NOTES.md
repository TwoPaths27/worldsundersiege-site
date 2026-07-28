# V19.7 — Animation and Visual Polish

## Added

- Reveal flip/burst animation for concealed units.
- Conceal fold animation when a unit becomes concealed.
- Mount and dismount transition animations.
- Construct Range activation and deactivation feedback.
- Mounted-combat damage target feedback.
- Reduced-motion support for all new effects.

## Integration

The new effects are integrated into the existing `animation.js` engine and called from:

- `conceal.js`
- `mount.js`
- `construct-range.js`
- `battlefield.js`

Animations do not mutate gameplay state and can be disabled by passing `{ animate: false }` to supported engine operations.
