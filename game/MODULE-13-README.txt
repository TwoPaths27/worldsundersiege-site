Worlds Under Siege — Module 13: Event and Trigger Engine

NEW
- events.js: queued synchronous Event Bus, listeners, trigger registry, and
  source-based trigger registration/removal.

UPDATED
- abilities.js: ability definitions can include trigger metadata; legacy
  triggerAbilities() now emits through the Event Bus.
- rules.js: emits combat, damage, destruction, and stronghold events.
- battlefield.js: emits summon and movement events; registers unit triggers.
- cards.js: emits cardPlayed and actionAddedToStack.
- priority.js: emits priority, stack, and ability-resolution events.
- match.js: emits match and turn lifecycle events.
- index.html: loads events.js before abilities.js and updates module versions.

CORE EVENT NAMES
matchStarted, turnStarted, turnEnding, turnEnded, cardPlayed,
actionAddedToStack, beforeAbilityResolved, abilityResolved,
actionRemovedFromStack, stackResolved, priorityPassed, unitSummoned,
unitMoved, combatStarted, beforeUnitDamage, unitDamaged, combatResolved,
beforeUnitDestroyed, unitDestroyed, beforeStrongholdDamage,
strongholdDamaged.

ADDING A TRIGGER
A card or unit may provide either `trigger` or `triggers`:

  triggers: [{
    event: "unitDestroyed",
    abilityId: "yourAbility",
    condition: ({ eventPayload, source }) => true
  }]

Call registerTriggersForSource(source) when it enters play and
unregisterTriggersForSource(source) when it permanently leaves play.
