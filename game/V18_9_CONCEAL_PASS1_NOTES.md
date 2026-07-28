# Worlds Under Siege v18.9 — Conceal Pass 1

Implemented the first playable Conceal integration:

- Characters and Animals may be deployed face-up or concealed.
- Concealed deployment records the actual Energy paid.
- Concealed units use effective Speed 1 and Range 0 without overwriting printed stats.
- Movement spent while concealed remains spent after manual reveal.
- Added owner-only Reveal button in the Selected Unit panel.
- Opponents see a generic concealed battlefield back and the paid cost only.
- Controllers retain real name and hover card preview.
- Generic target selection, Item attachment, and interaction helpers reject concealed units.
- Floating stack UI now renders Action entries only; attack/permanent entries remain engine-side but are no longer displayed.
- Added `conceal.js` as the central API for future automatic detection, mount separation, equipment destruction, and reveal chains.

Pass 2 remains responsible for automatic range detection, chain reveals, conceal-by-effect cleanup, Mount separation, equipped Item destruction, and full reveal-trigger lifecycle integration.
