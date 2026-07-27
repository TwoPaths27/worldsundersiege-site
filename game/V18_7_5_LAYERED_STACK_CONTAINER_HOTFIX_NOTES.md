# Worlds Under Siege v18.7.5 — Layered Stack Container Hotfix

## Fixed

- Added the missing `#floatingStackCards` DOM element required by the v18.7.3 layered full-card stack renderer.
- Wrapped the compact event list and layered card display in `.floating-stack__body`, matching the existing v18.7.3 CSS grid layout.
- Restored game initialization, which previously stopped in `validateRequiredElements()` before the match could begin.

## Changed files

- `index.html`
- `V18_7_5_LAYERED_STACK_CONTAINER_HOTFIX_NOTES.md`
