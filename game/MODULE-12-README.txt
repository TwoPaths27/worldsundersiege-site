WORLDS UNDER SIEGE — MODULE 12: ABILITY ENGINE

What changed
------------
1. abilities.js now owns a data-driven Ability Registry.
2. Taking Aim is registered as abilityId "takingAim" with aliases for
   "BOA-146" and "Taking Aim".
3. card-data.js stores abilityId and targetMode on cards.
4. cards.js asks the Ability Engine for user selection, targeting, validation,
   prompts, and play permission. The BOA-146 switch was removed.
5. battlefield.js highlights and accepts only targets approved by the ability.
6. priority.js resolves Action Stack entries through executeAbility() instead
   of a card-ID switch.
7. Action Stack entries now preserve abilityId when the card is played.

Adding an Action ability
------------------------
A. Register it in abilities.js:

registerAbility("myAbility", {
  targetMode: "unit",
  isEligibleUser(unit, context) { return true; },
  isEligibleTarget(target, context) { return true; },
  resolve(context) { /* apply effect */ }
});

B. Give the card this property in card-data.js or card-database.js:

abilityId: "myAbility"

Supported target modes currently used by the UI
------------------------------------------------
- "user": the selected Character is also the target and the Action commits
  immediately after choosing its User.
- "unit": the player chooses a battlefield Unit after choosing the User.

Compatibility
-------------
The global Abilities facade remains available for older code. Existing aliases
can resolve cards whose older data only supplies databaseId or name.
