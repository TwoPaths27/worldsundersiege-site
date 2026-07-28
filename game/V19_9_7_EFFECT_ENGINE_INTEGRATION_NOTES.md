# V19.9.7 — Effect Engine Integration

This release adds a centralized interpreter for reusable one-shot card effects.
It complements the existing continuous modifier engine in `effects.js`.

## Supported effect descriptors

- `draw`
- `damage`
- `heal`
- `gainEnergy` / `loseEnergy`
- `search`
- `reveal`
- `mill`
- `recover`
- `discard`
- `banish`
- `moveZone`
- `conceal`
- `revealConcealed`
- `destroy`
- `amass` / `reduceArmy`
- `addStatus`
- `continuous`
- `sequence`
- `log`

## Card format

Cards may define either `effect` or `effects`:

```js
{
  name: "Field Research",
  effects: [
    { type: "search", filter: { cardType: "Animal" }, amount: 1, to: "hand" },
    { type: "draw", amount: 1 }
  ]
}
```

Effects can address `you`, `opponent`, `source`, `user`, or `target` through their player/target fields. Existing chooser callbacks and zone filters are passed to the V19.9.6 zone-effect helpers.

## Ability integration

Fallback Action abilities now attempt to resolve structured card effects before using the old placeholder behavior. Existing hand-authored registered abilities remain unchanged and take priority.

## Public API

- `WUSEffectEngine.registerEffect()`
- `WUSEffectEngine.executeEffect()`
- `WUSEffectEngine.executeEffects()`
- `WUSEffectEngine.resolveCardEffects()`
- `WUSEffectEngine.auditEffects()`

Global convenience aliases are also exposed for effect execution and custom handler registration.
