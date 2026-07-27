# Worlds Under Siege v18.3 — Attack Declaration Priority

## Added

Unit and Stronghold attacks now use the shared pending-event priority system.
Choosing a legal target declares the attack but does not animate or deal damage
immediately.

The flow is now:

1. Choose attacker and target.
2. Commit the attack.
3. Store a generic pending attack event.
4. Open priority with reason `PRIORITY.ATTACK`.
5. Allow both players to play legal Actions or pass.
6. Resolve the Action stack.
7. Resume and revalidate the declared attack.
8. Animate combat and apply damage only if the attack remains legal.

## Attack commitment

A normal Unit spends its attack when the attack is declared. A Construct's
selected operator spends its attack at declaration. Removing or invalidating
the target afterward does not refund the attack.

## Resolution revalidation

Before combat resolves, the engine checks that:

- the attacker remains on the battlefield;
- a Construct's declared operator remains on the battlefield, remains a legal
  operator type, and remains orthogonally adjacent;
- the defender remains on the battlefield;
- the defender or Stronghold remains in range and legally attackable.

If a required object is gone or the target is no longer legal, the attack does
not resolve.

## Generic pending events

No dedicated `pendingAttack` state was added. Attacks use the existing
`GameState.pendingEvent` structure with a type, payload, and resume callback.
This same mechanism can support movement windows in v18.4.

## Updated files

- `battlefield.js`
- `priority.js`
