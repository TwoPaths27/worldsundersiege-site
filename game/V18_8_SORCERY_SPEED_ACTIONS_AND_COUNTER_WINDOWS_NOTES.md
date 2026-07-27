# v18.8 — Sorcery-Speed Actions and Counter Windows

## Flow changes

- Removed BS, DS, MS, and ES controls.
- Beginning and Draw advance automatically into Main.
- Ending a turn no longer opens an End Step priority window.
- Ordinary Actions are Sorcery Speed: active player's Main Step, empty stack, and no open priority window.
- Response windows pause only for legal Counter Actions (unless Full Control is enabled).
- Counter Actions can respond to Counter Actions.

## Counter cards

- BOA-141 Stand Your Ground — Counter; play only when an opponent declares an attack.
- BOA-155 Acrobatic Dodge — Counter; play only when its User is targeted by an opponent's effect.
- BOA-156 Arcane Deflect — Counter.
- BOA-157 Spring the Trap — Counter.

## Compatibility

The legacy phaseStops object remains as an empty object for save-state compatibility, but phase priority windows are no longer opened.
