# Worlds Under Siege v16.1 — Selection & Priority UI Hotfix

## Fixed

- Opening a priority window clears a previously selected non-Action card.
- Recruit highlights cannot remain active while priority is open.
- The Pass Priority prompt is positioned above the hand dock instead of covering the enemy Stronghold.
- A narrow-screen fallback keeps the prompt inside the viewport.

## Cause

A normal card selection could remain active when priority opened. That allowed recruitment UI and priority UI to be rendered at the same time.

## Completed

- v13 engine integration
- v14 card types, traits, and capabilities
- v15 Construct operation foundation
- v16 Item attachment foundation
- v16.1 selection/priority UI hotfix

## Remaining

- Item card implementations and attachment UI polish
- v17 persistent Events
- v18 Stronghold abilities
- Card implementation pass
- AI integration
- Automated gameplay tests
- Balance and UI polish
