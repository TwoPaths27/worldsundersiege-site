# Worlds Under Siege v18.5 — Stack Integration & Movement Responses

## Summary

v18.5 extends the v18.4 Stack Manager to attacks and completed movement. Actions,
triggered abilities, activated abilities, attacks, and movement response events
now share the same LIFO priority/resolution lifecycle.

## Movement response windows

After a legal move completes:

1. The Unit changes position and pays movement cost.
2. `unitMoved` is emitted immediately.
3. A Movement event enters the stack.
4. Priority opens with reason `PRIORITY.MOVE`.
5. Players may respond.
6. The Movement event resolves after both players pass.
7. `movementResponseWindowResolved` is emitted.

The move itself is not rolled back if the Movement event is countered or
fizzles; the stack entry represents the post-movement response window.

Movement payloads include:

- Unit ID and player ID
- Origin and destination
- Movement cost
- Remaining Speed
- Movement timestamp

## Attacks are true stack entries

Attack declarations no longer use `GameState.pendingEvent` as their primary
resolution mechanism. They now create entries of type `attack` with:

- declaration payload;
- resolution-time legality validation;
- asynchronous combat resolution;
- counter and fizzle lifecycle hooks.

Attack commitment still happens at declaration. A regular Unit consumes its
attack, and a Construct consumes its operator's attack, before priority opens.

At resolution, the engine rechecks:

- attacker existence;
- Construct operator existence and adjacency;
- defender existence;
- target legality;
- attack range.

## Generic gameplay event API

Added `queueGameEvent(options)`. It creates a normalized stack entry and opens
priority through one API. It supports synchronous or asynchronous `validate`,
`resolve`, `onCountered`, and `onFizzled` behavior.

## Asynchronous stack resolution

Custom stack-entry resolvers are now awaited. Combat animations and damage
resolution finish before the entry leaves the stack and priority reopens.

## Stack encapsulation

Action casting no longer contains a fallback that directly pushes into
`GameState.actionStack`. The Stack Manager is required.

Direct array mutations now remain confined to Stack Manager internals.

## Files changed

- `priority.js`
- `battlefield.js`
- `cards.js`
- `V18_5_STACK_INTEGRATION_AND_MOVEMENT_NOTES.md`
