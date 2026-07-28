# V19.4 — Mounted Combat

Implemented:

- Animals and Constructs carrying a rider cannot declare attacks or retaliate.
- Their passive, triggered, and activated abilities are otherwise unchanged.
- When combat damage would be dealt to a mounted Character, the opposing combatant's controller chooses whether the damage hits the Character or the Mount.
- Player 1 receives a direct choice prompt; the AI prioritizes lethal damage and otherwise attacks the Character.
- Combat damage is not split between rider and Mount.
- If the rider is destroyed, the Mount remains in place and the attachment is cleared.
- If the Mount is destroyed, the rider is detached into the Mount's battlefield square and preserves movement already spent.
- Combat logs now identify the actual permanent that received damage.

This pass does not yet add a custom graphical damage-choice modal; it uses the browser confirmation dialog for the local player's choice.
