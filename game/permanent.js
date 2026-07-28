"use strict";

/* Worlds Under Siege — v17 Permanent abstraction. */

const PermanentZones = Object.freeze({
  BATTLEFIELD: typeof ZoneTypes !== "undefined" ? ZoneTypes.BATTLEFIELD : "battlefield",
  DISCARD: typeof ZoneTypes !== "undefined" ? ZoneTypes.DISCARD : "discard",
});

function isPermanent(card) {
  return Boolean(card && (isUnit(card) || isConstruct(card) || isItem(card) || isEvent(card) || isStronghold(card)));
}

function normalizePermanent(permanent, options = {}) {
  if (!permanent || typeof permanent !== "object") return permanent;
  normalizeCard(permanent);
  permanent.owner ??= options.owner ?? options.controller ?? null;
  permanent.controller ??= options.controller ?? permanent.owner;
  permanent.zone ??= options.zone ?? permanent.zone ?? null;
  permanent.attachments ??= [];
  permanent.attachedTo ??= null;
  permanent.counters ??= {};
  permanent.permanentState ??= {};
  Object.assign(permanent.permanentState, {
    entering: false,
    leaving: false,
    destroyed: false,
    registered: false,
    ...(permanent.permanentState || {}),
  });
  if (typeof initializeConcealState === "function") initializeConcealState(permanent);
    permanent._permanentRegistrations ??= {
    triggerIds: [], replacementIds: [], continuousEffectIds: []
  };
  return permanent;
}


function resetPermanentState(permanent) {
  permanent.permanentState.entering = false;
  permanent.permanentState.leaving = false;
  permanent.permanentState.destroyed = false;
  return permanent;
}

function normalizeDefinitions(value) {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

function getPermanentGameplayIdentity(permanent) {
  if (!permanent || typeof permanent !== "object") return null;

  return (
    permanent.gameplayId ??
    permanent.databaseId ??
    permanent.sourceCard?.gameplayId ??
    permanent.sourceCard?.databaseId ??
    permanent.sourceCard?.id ??
    permanent.id ??
    null
  );
}

function isUniqueUnitPermanent(permanent) {
  if (!permanent) return false;

  const character =
    typeof isCharacter === "function"
      ? isCharacter(permanent)
      : permanent.type === "Character" ||
        permanent.cardType === "Character" ||
        permanent.types?.includes?.("Character");

  const animal =
    typeof isAnimal === "function"
      ? isAnimal(permanent)
      : permanent.type === "Animal" ||
        permanent.cardType === "Animal" ||
        permanent.types?.includes?.("Animal");

  return Boolean(character || animal);
}

function isPermanentCurrentlyUnique(permanent) {
  return Boolean(
    isUniqueUnitPermanent(permanent) &&
    permanent.isUnique !== false &&
    permanent.permanentState?.isUnique !== false &&
    permanent.sourceCard?.isUnique !== false &&
    permanent.sourceCard?.permanentState?.isUnique !== false
  );
}

function getControlledBattlefieldPermanents(controller, options = {}) {
  if (Array.isArray(options.battlefieldPermanents)) {
    return options.battlefieldPermanents;
  }

  if (
    typeof GameState !== "undefined" &&
    Array.isArray(GameState.units)
  ) {
    return GameState.units;
  }

  return [];
}

function findConflictingUniquePermanent(permanent, options = {}) {
  if (!isPermanentCurrentlyUnique(permanent)) return null;

  const controller =
    options.controller ??
    permanent.controller ??
    permanent.owner;

  const identity = getPermanentGameplayIdentity(permanent);
  if (controller == null || identity == null) return null;

  return (
    getControlledBattlefieldPermanents(controller, options).find((existing) => {
      if (!existing || existing === permanent) return false;

      const existingController =
        existing.controller ??
        existing.owner;

      return (
        existingController === controller &&
        isPermanentCurrentlyUnique(existing) &&
        getPermanentGameplayIdentity(existing) === identity
      );
    }) ?? null
  );
}

function canEnterPermanent(permanent, options = {}) {
  normalizePermanent(permanent, options);

  if (!isPermanent(permanent)) {
    return {
      allowed: false,
      reason: "not-permanent",
      message: "Only permanent cards can enter the battlefield.",
      conflict: null,
    };
  }

  const conflict = findConflictingUniquePermanent(permanent, options);

  if (conflict) {
    return {
      allowed: false,
      reason: "unique-conflict",
      message:
        `${permanent.name ?? "That card"} is unique. ` +
        `Its controller already controls a copy.`,
      conflict,
    };
  }

  return {
    allowed: true,
    reason: null,
    message: "",
    conflict: null,
  };
}

function registerPermanent(permanent) {
  normalizePermanent(permanent);
  if (!isPermanent(permanent) || permanent.permanentState.registered) return permanent;

  if (typeof registerTriggersForSource === "function") {
    permanent._permanentRegistrations.triggerIds = registerTriggersForSource(permanent) || [];
  }

  const replacements = normalizeDefinitions(permanent.replacementEffects);
  if (typeof registerReplacementEffect === "function") {
    permanent._permanentRegistrations.replacementIds = replacements.map((definition) =>
      registerReplacementEffect({ ...definition, source: definition.source ?? permanent, controller: definition.controller ?? permanent.controller })?.id
    ).filter(Boolean);
  }

  const effects = normalizeDefinitions(permanent.continuousEffects ?? permanent.staticEffects);
  if (typeof addContinuousEffect === "function") {
    permanent._permanentRegistrations.continuousEffectIds = effects.map((definition) =>
      addContinuousEffect({ ...definition, source: definition.source ?? permanent, controller: definition.controller ?? permanent.controller, expiresWithSource: definition.expiresWithSource !== false })?.id
    ).filter(Boolean);
  }

  permanent.permanentState.registered = true;
  return permanent;
}

function unregisterPermanent(permanent, reason = "left-battlefield") {
  normalizePermanent(permanent);
  if (typeof unregisterTriggersForSource === "function") unregisterTriggersForSource(permanent);
  if (typeof unregisterReplacementEffectsForSource === "function") unregisterReplacementEffectsForSource(permanent);
  if (typeof removeContinuousEffect === "function") {
    for (const id of permanent._permanentRegistrations.continuousEffectIds || []) removeContinuousEffect(id, reason);
  }
  permanent._permanentRegistrations = { triggerIds: [], replacementIds: [], continuousEffectIds: [] };
  permanent.permanentState.registered = false;
  return permanent;
}

function enterPermanent(permanent, options = {}) {
  normalizePermanent(permanent, options);

  if (!isPermanent(permanent)) {
    throw new TypeError("enterPermanent() requires a permanent card.");
  }

  const legality = canEnterPermanent(permanent, options);

  if (!legality.allowed) {
    if (options.logFailure !== false && typeof addLog === "function") {
      addLog(legality.message);
    }

    return false;
  }

  permanent.permanentState.entering = true;
  permanent.zone = options.zone ?? PermanentZones.BATTLEFIELD;
  registerPermanent(permanent);
  resetPermanentState(permanent);

  if (typeof emitGameEvent === "function") {
    emitGameEvent(
      "permanentEntered",
      {
        permanent,
        playerId: permanent.controller,
        cause: options.cause ?? "played",
      },
      { source: permanent }
    );
  }

  return permanent;
}

function leavePermanent(permanent, options = {}) {
  normalizePermanent(permanent);
  if (!isPermanent(permanent) || permanent.permanentState.leaving) return false;
  permanent.permanentState.leaving = true;
  if (typeof emitGameEvent === "function") {
    emitGameEvent("permanentLeaving", { permanent, cause: options.cause ?? "left-play", destination: options.destination ?? PermanentZones.DISCARD }, { source: options.source ?? permanent });
  }
  if (typeof destroyItemsAttachedTo === "function" && !isItem(permanent)) {
    destroyItemsAttachedTo(permanent, { cause: "host-left-play", source: options.source ?? permanent });
  }
  unregisterPermanent(permanent, options.cause);
  permanent.zone = options.destination ?? PermanentZones.DISCARD;
  permanent.permanentState.destroyed = options.destroyed === true;
  permanent.permanentState.leaving = false;
  if (typeof emitGameEvent === "function") {
    emitGameEvent("permanentLeft", { permanent, cause: options.cause ?? "left-play", destination: permanent.zone }, { source: options.source ?? permanent });
  }
  return true;
}
