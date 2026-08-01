"use strict";

/*
 * Worlds Under Siege — v13 Effects Engine
 * Continuous modifiers, derived statistics, statuses, and duration cleanup.
 */

const ModifierLayers = Object.freeze({
  BASE: 0,
  SET: 10,
  EQUIPMENT: 20,
  AURA: 30,
  BUFF: 40,
  DEBUFF: 50,
  STATUS: 60,
  FINAL: 100,
});

const StatusTypes = Object.freeze({
  STUNNED: "stunned",
  POISONED: "poisoned",
  BURNING: "burning",
  FROZEN: "frozen",
  SILENCED: "silenced",
  SHIELDED: "shielded",
  ROOTED: "rooted",
  INVISIBLE: "invisible",
});

let nextEffectId = 1;
let nextStatusId = 1;

function ensureEffectState() {
  GameState.continuousEffects ??= [];
  GameState.effectHistory ??= [];
}

function normalizeUnitBaseStats(unit) {
  if (!unit) return unit;

  unit.baseAttack ??= unit.printedAttack ?? unit.currentAttack ?? unit.attack ?? 0;
  unit.baseHP ??= unit.printedHP ?? unit.maxHP ?? unit.currentHP ?? unit.hp ?? 0;
  unit.baseRange ??= unit.printedRange ?? unit.currentRange ?? unit.range ?? 0;
  unit.baseSpeed ??= unit.printedSpeed ?? unit.currentSpeed ?? unit.speed ?? 0;
  unit.statuses ??= [];

  return unit;
}

function createContinuousEffect(options = {}) {
  ensureEffectState();

  return {
    id: options.id ?? `effect-${nextEffectId++}`,
    source: options.source ?? null,
    controller: options.controller ?? options.owner ?? null,
    target: options.target ?? null,
    targets: options.targets ? [...options.targets] : null,
    layer: Number(options.layer ?? ModifierLayers.BUFF),
    duration: options.duration ?? "permanent",
    createdTurn: options.createdTurn ?? GameState.turn,
    expiresOnTurn: options.expiresOnTurn ?? null,
    expiresOnPhase: options.expiresOnPhase ?? null,
    expiresForPlayer: options.expiresForPlayer ?? null,
    expiresWithSource: Boolean(options.expiresWithSource),
    active: options.active !== false,
    appliesTo:
      typeof options.appliesTo === "function"
        ? options.appliesTo
        : null,
    modifier:
      typeof options.modifier === "function"
        ? options.modifier
        : () => {},
    metadata: options.metadata ?? {},
  };
}

function addContinuousEffect(effectOrOptions) {
  ensureEffectState();

  const effect =
    effectOrOptions?.id && typeof effectOrOptions.modifier === "function"
      ? effectOrOptions
      : createContinuousEffect(effectOrOptions);

  GameState.continuousEffects.push(effect);

  if (typeof emitGameEvent === "function") {
    emitGameEvent("continuousEffectAdded", { effect }, { source: effect.source });
  }

  return effect;
}

function removeContinuousEffect(effectId, reason = "removed") {
  ensureEffectState();

  const index = GameState.continuousEffects.findIndex(
    (effect) => effect.id === effectId
  );

  if (index < 0) return false;

  const [effect] = GameState.continuousEffects.splice(index, 1);
  GameState.effectHistory.push({
    effectId: effect.id,
    reason,
    removedAt: Date.now(),
    turn: GameState.turn,
  });

  if (typeof emitGameEvent === "function") {
    emitGameEvent(
      "continuousEffectRemoved",
      { effect, reason },
      { source: effect.source }
    );
  }

  return true;
}

function effectTargetsUnit(effect, unit) {
  if (!effect.active) return false;

  if (effect.appliesTo) {
    return effect.appliesTo(unit, {
      game: GameState,
      effect,
    }) !== false;
  }

  const unitId = unit?.id;

  if (effect.targets) {
    return effect.targets.some((target) =>
      (typeof target === "object" ? target?.id : target) === unitId
    );
  }

  if (effect.target == null) return true;

  return (typeof effect.target === "object"
    ? effect.target?.id
    : effect.target) === unitId;
}

function createModifierContext(unit) {
  normalizeUnitBaseStats(unit);

  return {
    attack: Number(unit.baseAttack) || 0,
    maxHP: Number(unit.baseHP) || 0,
    range: Number(unit.baseRange) || 0,
    speed: Number(unit.baseSpeed) || 0,
    keywords: new Set(unit.keywords ?? []),
    restrictions: new Set(),
    metadata: {},
  };
}


const KING_ARTHUR_IDS = new Set(["BOA-001", "BOA-226", "SD1-001"]);

function getIdentitySet(value) {
  return new Set([
    value?.type,
    value?.cardType,
    ...(Array.isArray(value?.types) ? value.types : []),
    ...(Array.isArray(value?.traits) ? value.traits : []),
    ...(Array.isArray(value?.characteristics) ? value.characteristics : []),
  ].filter(Boolean).map((entry) => String(entry).trim().toLowerCase()));
}

function getControllerId(value) {
  return Number(value?.controller ?? value?.owner);
}

function isFaceUpBattlefieldPermanent(value) {
  if (!value || value.isConcealed) return false;
  return !value.zone || String(value.zone).toLowerCase() === "battlefield";
}

function isKingArthur(value) {
  if (!value) return false;
  const ids = [
    value.databaseId,
    value.gameplayId,
    value.variantOf,
    value.sourceCard?.databaseId,
    value.sourceCard?.gameplayId,
  ].filter(Boolean).map((id) => String(id).toUpperCase());
  return value.name === "King Arthur" || ids.some((id) => KING_ARTHUR_IDS.has(id));
}

const BattlefieldAuraDefinitions = Object.freeze([
  {
    id: "king-arthur-chosen-king",
    sourceMatches: isKingArthur,
    appliesTo(target, source) {
      if (!target || !source || target.isConcealed || target === source || target.id === source.id) return false;
      if (getControllerId(target) !== getControllerId(source)) return false;
      const identities = getIdentitySet(target);
      return identities.has("character") || identities.has("animal") || identities.has("army");
    },
    modify(context) {
      context.attack += 2;
      context.speed += 1;
    },
  },
]);

function getActiveBattlefieldAuras() {
  const active = [];
  for (const source of GameState.units ?? []) {
    if (!isFaceUpBattlefieldPermanent(source)) continue;
    for (const definition of BattlefieldAuraDefinitions) {
      if (definition.sourceMatches(source)) active.push({ ...definition, source });
    }
  }
  return active;
}

function getModifiedStats(unit) {
  ensureEffectState();
  const context = createModifierContext(unit);

  const applicableEffects = GameState.continuousEffects
    .filter((effect) => effectTargetsUnit(effect, unit))
    .sort((first, second) =>
      first.layer - second.layer ||
      String(first.id).localeCompare(String(second.id))
    );

  for (const effect of applicableEffects) {
    try {
      effect.modifier(context, unit, effect);
    } catch (error) {
      console.error(`Continuous effect "${effect.id}" failed.`, error);
    }
  }

  /* Dynamic battlefield auras ------------------------------------------- */
  for (const aura of getActiveBattlefieldAuras()) {
    if (!aura.appliesTo(unit, aura.source)) continue;
    try {
      aura.modify(context, unit, aura.source);
    } catch (error) {
      console.error(`Battlefield aura "${aura.id}" failed.`, error);
    }
  }

  for (const status of unit.statuses ?? []) {
    if (status.active === false) continue;

    if (
      status.type === StatusTypes.STUNNED ||
      status.type === StatusTypes.FROZEN
    ) {
      context.restrictions.add("cannotAct");
    }

    if (status.type === StatusTypes.ROOTED) {
      context.restrictions.add("cannotMove");
    }

    if (status.type === StatusTypes.SILENCED) {
      context.restrictions.add("silenced");
    }
  }

  context.attack = Math.max(0, Number(context.attack) || 0);
  context.maxHP = Math.max(0, Number(context.maxHP) || 0);
  context.range = Math.max(0, Number(context.range) || 0);
  context.speed = Math.max(0, Number(context.speed) || 0);

  return context;
}


function recalculateAllUnitStats() {
  for (const unit of GameState.units ?? []) {
    normalizeUnitBaseStats(unit);
    const previousSpeed = Number(unit.currentSpeed ?? unit.baseSpeed ?? 0) || 0;
    const previousMaxHP = Number(unit.maxHP ?? unit.baseHP ?? unit.printedHP ?? 0) || 0;
    const damage = Math.max(0, previousMaxHP - (Number(unit.currentHP) || 0));
    const stats = getModifiedStats(unit);

    unit.currentAttack = stats.attack;
    unit.currentRange = stats.range;
    unit.currentSpeed = stats.speed;
    unit.maxHP = stats.maxHP;

    if (unit.currentHP != null) unit.currentHP = Math.max(0, stats.maxHP - damage);
    if (unit.remainingSpeed != null && previousSpeed !== stats.speed) {
      unit.remainingSpeed = Math.max(0, Number(unit.remainingSpeed) + (stats.speed - previousSpeed));
    }
  }
  return GameState.units ?? [];
}

function getCurrentAttack(unit) {
  return getModifiedStats(unit).attack;
}

function getCurrentMaxHP(unit) {
  return getModifiedStats(unit).maxHP;
}

function getCurrentRange(unit) {
  return getModifiedStats(unit).range;
}

function getCurrentSpeed(unit) {
  return getModifiedStats(unit).speed;
}

function getCurrentHealth(unit) {
  return Number(unit?.currentHP ?? getCurrentMaxHP(unit)) || 0;
}

function hasKeyword(unit, keyword) {
  return getModifiedStats(unit).keywords.has(keyword);
}

function hasStatus(unit, type) {
  return Boolean(
    unit?.statuses?.some(
      (status) => status.type === type && status.active !== false
    )
  );
}

function addStatus(unit, options = {}) {
  if (!unit) return null;
  normalizeUnitBaseStats(unit);

  const status = {
    id: options.id ?? `status-${nextStatusId++}`,
    type: options.type,
    source: options.source ?? null,
    controller: options.controller ?? null,
    stacks: Math.max(1, Number(options.stacks ?? 1)),
    duration: options.duration ?? "permanent",
    createdTurn: options.createdTurn ?? GameState.turn,
    expiresOnTurn: options.expiresOnTurn ?? null,
    expiresForPlayer: options.expiresForPlayer ?? null,
    active: options.active !== false,
    metadata: options.metadata ?? {},
  };

  unit.statuses.push(status);

  if (typeof emitGameEvent === "function") {
    emitGameEvent("statusAdded", { unit, status }, { source: status.source });
  }

  return status;
}

function removeStatus(unit, statusId, reason = "removed") {
  if (!unit?.statuses) return false;

  const index = unit.statuses.findIndex((status) => status.id === statusId);
  if (index < 0) return false;

  const [status] = unit.statuses.splice(index, 1);

  if (typeof emitGameEvent === "function") {
    emitGameEvent(
      "statusRemoved",
      { unit, status, reason },
      { source: status.source }
    );
  }

  return true;
}

function sourceStillInPlay(source) {
  const sourceId = typeof source === "object" ? source?.id : source;
  if (!sourceId) return false;

  return GameState.units.some((unit) => unit.id === sourceId) ||
    (GameState.items ?? []).some((item) => item.id === sourceId);
}

function shouldExpireEffect(effect, timing = {}) {
  if (!effect.active) return true;

  if (
    effect.expiresWithSource &&
    !sourceStillInPlay(effect.source)
  ) {
    return true;
  }

  if (
    effect.expiresOnTurn != null &&
    GameState.turn > effect.expiresOnTurn
  ) {
    return true;
  }

  if (
    timing.phase &&
    effect.expiresOnPhase === timing.phase &&
    (
      effect.expiresForPlayer == null ||
      effect.expiresForPlayer === timing.playerId
    )
  ) {
    return true;
  }

  if (
    effect.duration === "untilEndOfTurn" &&
    timing.phase === "turnEnd" &&
    (
      effect.expiresForPlayer == null ||
      effect.expiresForPlayer === timing.playerId
    )
  ) {
    return true;
  }

  return false;
}

function updateContinuousEffects(timing = {}) {
  ensureEffectState();

  const expired = GameState.continuousEffects.filter((effect) =>
    shouldExpireEffect(effect, timing)
  );

  for (const effect of expired) {
    removeContinuousEffect(effect.id, "expired");
  }

  for (const unit of GameState.units) {
    normalizeUnitBaseStats(unit);

    for (const status of [...unit.statuses]) {
      const expires =
        status.active === false ||
        (
          status.expiresOnTurn != null &&
          GameState.turn > status.expiresOnTurn
        ) ||
        (
          status.duration === "untilEndOfTurn" &&
          timing.phase === "turnEnd" &&
          (
            status.expiresForPlayer == null ||
            status.expiresForPlayer === timing.playerId
          )
        );

      if (expires) removeStatus(unit, status.id, "expired");
    }
  }

  return expired;
}

function resetEffectsEngine() {
  GameState.continuousEffects = [];
  GameState.effectHistory = [];

  for (const unit of GameState.units ?? []) {
    normalizeUnitBaseStats(unit);
    unit.statuses = [];
  }
}


const LANCELOT_IDS = new Set(["BOA-003"]);

function isSirLancelot(value) {
  if (!value) return false;
  const ids = [
    value.databaseId, value.gameplayId, value.variantOf, value.sharedCardId,
    value.sourceCard?.databaseId, value.sourceCard?.gameplayId,
  ].filter(Boolean).map((id) => String(id).toUpperCase());
  return value.name === "Sir Lancelot" || value.name === "Lancelot" ||
    ids.some((id) => LANCELOT_IDS.has(id));
}

function getCurrentTurnIdentity() {
  return `${Number(GameState.turn) || 0}:${Number(GameState.activePlayer) || 0}`;
}

function isLancelotRevealTurnActive(unit) {
  return Boolean(unit && isSirLancelot(unit) &&
    unit.lancelotRevealTurnIdentity === getCurrentTurnIdentity());
}

function applyLancelotRevealEffect(unit) {
  if (!isSirLancelot(unit)) return false;

  const turnIdentity = getCurrentTurnIdentity();
  if (unit.lancelotRevealTurnIdentity === turnIdentity) return false;

  unit.lancelotRevealTurnIdentity = turnIdentity;
  const effectId = `lancelot-reveal-speed:${unit.id}:${turnIdentity}`;

  addContinuousEffect({
    id: effectId,
    active: true,
    source: unit,
    controller: unit.controller ?? unit.owner,
    target: unit.id,
    layer: ModifierLayers.BUFF,
    duration: "untilEndOfTurn",
    expiresForPlayer: GameState.activePlayer,
    modifier(stats) {
      stats.speed += 3;
    },
    metadata: {
      kind: "lancelot-reveal-speed",
      amount: 3,
      turnIdentity,
    },
  });

  recalculateAllUnitStats();

  /*
   * Keep the movement pool in sync immediately. Some battlefield code reads
   * remainingSpeed directly before the next full render, so relying only on
   * currentSpeed made the +3 bonus appear missing even though the modifier
   * existed in the continuous-effect list.
   */
  const movementSpent = Math.max(0, Number(unit.movementSpent ?? 0) || 0);
  unit.remainingSpeed = Math.max(0, Number(unit.currentSpeed ?? unit.baseSpeed ?? 0) - movementSpent);

  if (typeof addLog === "function") {
    addLog(`${unit.name} gains +3 SPD until the end of the turn and can only attack Units and Constructs this turn.`);
  }
  return true;
}

if (typeof onGameEvent === "function") {
  /*
   * Playing a Unit face-up is a reveal for card-rule purposes. Listen to both
   * facts so Lancelot receives the bonus whether he is recruited face-up or
   * turned face-up from Conceal. The turn-identity guard prevents duplicates.
   */
  onGameEvent("unitEnteredPlay", (event) => {
    const unit = event?.payload?.unit;
    if (unit && !unit.isConcealed) applyLancelotRevealEffect(unit);
  }, { priority: 30 });

  onGameEvent("unitRevealed", (event) => {
    applyLancelotRevealEffect(event?.payload?.unit);
  }, { priority: 25 });

  onGameEvent("turnEnded", (event) => {
    const endedPlayer = Number(event?.payload?.playerId);
    for (const unit of GameState.units ?? []) {
      if (isSirLancelot(unit) && Number(unit.lancelotRevealTurnIdentity?.split?.(":")?.[1]) === endedPlayer) {
        unit.lancelotRevealTurnIdentity = null;
      }
    }
  }, { priority: -60 });

  for (const eventType of [
    "unitEnteredPlay", "unitRevealed", "unitConcealed", "unitLeavingPlay",
    "unitDestroyed", "unitLeftPlay", "unitControlChanged", "unitMounted", "unitDismounted",
  ]) {
    onGameEvent(eventType, () => recalculateAllUnitStats(), { priority: -50 });
  }
}

ensureEffectState();

window.ModifierLayers = ModifierLayers;
window.StatusTypes = StatusTypes;
window.normalizeUnitBaseStats = normalizeUnitBaseStats;
window.createContinuousEffect = createContinuousEffect;
window.addContinuousEffect = addContinuousEffect;
window.removeContinuousEffect = removeContinuousEffect;
window.getModifiedStats = getModifiedStats;
window.recalculateAllUnitStats = recalculateAllUnitStats;
window.getActiveBattlefieldAuras = getActiveBattlefieldAuras;
window.getCurrentAttack = getCurrentAttack;
window.getCurrentMaxHP = getCurrentMaxHP;
window.getCurrentHealth = getCurrentHealth;
window.getCurrentRange = getCurrentRange;
window.getCurrentSpeed = getCurrentSpeed;
window.hasKeyword = hasKeyword;
window.hasStatus = hasStatus;
window.addStatus = addStatus;
window.removeStatus = removeStatus;
window.updateContinuousEffects = updateContinuousEffects;
window.resetEffectsEngine = resetEffectsEngine;
window.isSirLancelot = isSirLancelot;
window.isLancelotRevealTurnActive = isLancelotRevealTurnActive;
window.applyLancelotRevealEffect = applyLancelotRevealEffect;
