# V19.9.7.4 — King Arthur Aura Fix

- Added a reusable dynamic battlefield-aura registry.
- Implemented King Arthur / BOA-001 / BOA-226 / SD1-001 as a live aura.
- Other friendly Characters, Animals, and Armies receive +2 ATK and +1 SPD.
- Arthur never buffs himself.
- Concealed or absent Arthurs do not provide the aura.
- Added derived-stat synchronization for battlefield UI and legacy combat paths.
- Stat synchronization runs on rendering and relevant unit lifecycle/control events.
- Runtime units now initialize an explicit controller field.
