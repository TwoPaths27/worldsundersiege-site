# Worlds Under Siege v18.4 — Stack Response Engine

## Summary

v18.4 centralizes Action and ability stack handling into a reusable Stack
Manager while preserving the existing UI and Action-resolution behavior.

## Added

### Generic stack-entry schema

Every normalized stack entry now supports:

- `stackId` / `id`
- `type`
- `owner` / `controller`
- `source`
- `sourceId`
- `sourceName`
- `payload`
- `createdAt` / `timestamp`
- `status`
- `validate`
- `resolve`
- `onCountered`
- `onFizzled`

Legacy Action and trigger fields remain intact.

### Stack Manager helpers

- `createStackEntryId(type)`
- `normalizeStackEntry(entry)`
- `addStackEntry(entry, options)`
- `peekStackEntry()`
- `findStackEntry(stackId)`
- `removeStackEntry(entryOrId)`
- `clearStackEntries(reason)`
- `isStackEmpty()`
- `counterStackEntry(entryOrId, context)`

Gameplay code should use these helpers instead of directly mutating
`GameState.actionStack`.

### Activated ability support

- `createActivatedAbilityStackEntry(options)`
- `queueActivatedAbility(options)`

Activated abilities can now enter the same LIFO stack as Actions and triggers.
No activated-ability UI was added in this milestone.

### Resolution lifecycle

Before resolving, the Stack Manager:

1. Checks whether the entry was countered.
2. Runs its optional `validate` hook.
3. Runs its custom `resolve` hook, or the existing Action/trigger resolver.
4. Calls `onFizzled` when resolution fails.
5. Calls `onCountered` for countered entries.

Countered entries remain on the stack until they reach the top, then leave
through the normal resolution cleanup. This preserves LIFO ordering.

## Action response flow

After an Action enters the stack, its controller receives priority first.
Smart auto-pass from v18.1 normally passes automatically, producing the
expected MTG Arena feel. Full Control allows the controller to retain that
priority opportunity.

After both players pass:

- the top stack entry resolves;
- if entries remain, priority reopens;
- if the stack is empty, the pending gameplay event resumes.

## Migrated systems

- Hand Actions now use `addStackEntry()`.
- Triggered abilities now use `addStackEntry()`.
- Existing attack pending events continue to pause and resume through the same
  priority system.

## Not included yet

- Movement response windows
- Visible stack targeting for Counter effects
- Activated-ability buttons
- Arena-style stop controls
- Converting attack declarations themselves into visible stack entries

Those remain upcoming milestones.
