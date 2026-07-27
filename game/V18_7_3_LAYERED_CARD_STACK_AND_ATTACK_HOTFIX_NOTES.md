# v18.7.3 — Layered Card Stack and Attack Resolution Hotfix

## Attack resolution

Fixed declared attacks fizzling before combat. Declaring an attack spends the attack immediately, but the old resolution legality check called the normal target finder, which rejects units whose attack is already spent. Resolution now checks range and protection while intentionally ignoring the already-spent attack flag.

This restores:

- attack and retaliation animations,
- unit HP damage,
- Stronghold HP damage,
- destruction and discard animations,
- normal post-combat selection cleanup.

## Layered full-card stack

The battlefield stack now presents two linked views:

- compact event summaries,
- overlapping full-card representations beside them, immediately to the left of the permanent Card Preview panel.

The newest response is placed on top. Older cards remain offset enough to expose their headers and stack order. Hovering or focusing a card brings it forward, dims the other layers, and preserves source/target battlefield highlighting.

Attack entries use the attacking permanent's full card representation. Action and ability entries use their source card when one is available.
