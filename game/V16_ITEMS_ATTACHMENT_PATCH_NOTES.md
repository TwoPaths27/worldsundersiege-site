# Worlds Under Siege v16 — Items & Attachment Foundation

## Implemented
- Item cards select eligible battlefield hosts instead of recruiting spaces.
- Characters can equip Items by default through the capability system.
- Card-specific attachment rules can require types/traits, exclude types, supply custom validation, and set per-host limits.
- Attached Items persist on the battlefield in `GameState.items`.
- Equipment stat modifiers use the continuous-effects EQUIPMENT layer.
- Supported generic modifiers: attack, HP, range, and speed.
- Attached Items are destroyed when their host leaves play.
- Item destruction emits a replaceable `itemWouldBeDestroyed` event, allowing replacement/prevention effects to override cleanup.
- Item and attachment lifecycle events are emitted and triggers are registered/unregistered.
- Eligible hosts receive visible battlefield highlighting.

## Compatibility
Legacy Item cards require only `type: "Item"`. By default they attach to cards with the `equipItems` capability. Exceptional Items may define `attachmentRule`.

Example:
```js
attachmentRule: {
  requiresTypes: [CardTypes.ANIMAL],
  maxPerHost: 1,
}
modifiers: { speed: 1 }
```

## Remaining
- Implement individual Item card texts and special equip/unequip effects.
- Add dedicated attached-Item badges/tooltips to Unit tokens.
- Add voluntary detach/transfer only for cards whose text permits it.
- v17 persistent Event system.
- v18 Stronghold ability integration.
- AI, automated tests, card pass, and UI polish.
