"use strict";

/*
 * Module 12 - Ability Engine
 * Central registry for all card and unit abilities.
 */

const AbilityRegistry = Object.create(null);

function registerAbility(id, definition) {
  if (!id || typeof id !== "string") throw new Error("Ability id required");
  AbilityRegistry[id] = Object.freeze({
    targetMode: "none",
    canPlay: () => true,
    resolve: () => {},
    ...definition
  });
}

function getAbility(id) {
  return AbilityRegistry[id] ?? null;
}

function getAbilityTargetMode(id) {
  return getAbility(id)?.targetMode ?? "none";
}

function canPlayAbility(id, context={}) {
  const ability=getAbility(id);
  return ability ? ability.canPlay(context)!==false : false;
}

function executeAbility(id, context={}) {
  const ability=getAbility(id);
  if (!ability) {
    console.warn(`Unknown ability: ${id}`);
    return false;
  }
  ability.resolve(context);
  return true;
}

// ---- Built-in abilities ----

registerAbility("takingAim",{
  targetMode:"user",
  resolve({user}) {
    if (!user) return;
    user.temporaryRangeBonus=(user.temporaryRangeBonus||0)+2;
    user.currentRange=(user.currentRange??user.printedRange??0)+2;
  }
});

registerAbility("charge",{targetMode:"none"});
registerAbility("flying",{targetMode:"none"});
registerAbility("guard",{targetMode:"none"});
registerAbility("ranged",{targetMode:"none"});
