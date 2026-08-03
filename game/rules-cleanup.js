"use strict";

/* Worlds Under Siege — v19.8 rules cleanup and state-based actions. */
(function rulesCleanupModule(global) {
  function getGameState() {
    if (global?.GameState) return global.GameState;
    if (typeof GameState !== "undefined") return GameState;
    return null;
  }

  const idOf = (unit) => unit?.id ?? unit?.instanceId ?? null;
  const controllerOf = (unit) => Number(unit?.controller ?? unit?.owner);
  const allUnits = () => Array.isArray(getGameState()?.units) ? getGameState().units : [];
  const unitById = (id) => allUnits().find((unit) => idOf(unit) === id) ?? null;

  function isOnBattlefield(unit) {
    const id = idOf(unit);
    return Boolean(id && unitById(id));
  }

  function clearMountLinks(character, mount) {
    if (character) character.mountedOn = null;
    if (mount) mount.riderId = null;
  }

  function validateMountedPair(character, mount) {
    if (!character || !mount) return { valid: false, reason: "missing-partner" };
    if (!isOnBattlefield(character) || !isOnBattlefield(mount)) return { valid: false, reason: "left-battlefield" };
    if (mount.riderId !== idOf(character) || character.mountedOn !== idOf(mount)) return { valid: false, reason: "link-mismatch" };
    if (controllerOf(character) !== controllerOf(mount)) return { valid: false, reason: "controller-mismatch" };
    if (character.isConcealed || mount.isConcealed) return { valid: false, reason: "concealed-pair" };
    return { valid: true, reason: null };
  }

  function repairMountRelationships(options = {}) {
    const repairs = [];
    for (const unit of allUnits()) {
      if (unit.mountedOn) {
        const mount = unitById(unit.mountedOn);
        const result = validateMountedPair(unit, mount);
        if (!result.valid) {
          clearMountLinks(unit, mount);
          repairs.push({ character: unit, mount, reason: result.reason });
        }
      }
      if (unit.riderId) {
        const rider = unitById(unit.riderId);
        const result = validateMountedPair(rider, unit);
        if (!result.valid) {
          clearMountLinks(rider, unit);
          repairs.push({ character: rider, mount: unit, reason: result.reason });
        }
      }
    }
    if (repairs.length && options.log !== false && typeof global.addLog === "function") {
      for (const repair of repairs) {
        const pairName = [repair.character?.name, repair.mount?.name].filter(Boolean).join(" and ") || "A mounted pair";
        global.addLog(`${pairName} separated (${repair.reason}).`);
      }
    }
    return repairs;
  }

  function normalizeUnitState(unit) {
    if (!unit || typeof unit !== "object") return unit;
    if (typeof global.initializeConcealState === "function") global.initializeConcealState(unit);
    if (typeof global.initializeMountState === "function") global.initializeMountState(unit);
    unit.currentHP = Number.isFinite(Number(unit.currentHP)) ? Number(unit.currentHP) : Number(unit.hp ?? 0);
    unit.movementSpent = Math.max(0, Number(unit.movementSpent) || 0);
    if (unit.isConcealed) {
      unit.remainingSpeed = Math.max(0, 1 - unit.movementSpent);
    } else if (typeof global.getRemainingEffectiveSpeed === "function") {
      unit.remainingSpeed = global.getRemainingEffectiveSpeed(unit);
    }
    return unit;
  }

  function destroyLethalUnits(options = {}) {
    if (typeof global.destroyUnit !== "function") return [];
    const destroyed = [];
    let safety = Math.max(4, allUnits().length * 2 + 2);
    while (safety-- > 0) {
      const lethal = allUnits().filter((unit) => Number(unit.currentHP ?? unit.hp ?? 0) <= 0);
      if (!lethal.length) break;
      let changed = false;
      for (const unit of lethal) {
        if (!isOnBattlefield(unit)) continue;
        if (global.destroyUnit(unit, {
          cause: options.cause ?? "state-based-lethal-damage",
          source: options.source ?? unit,
          skipStateCheck: true,
        })) {
          destroyed.push(unit);
          changed = true;
        }
      }
      if (!changed) break;
    }
    return destroyed;
  }

  function runStateBasedActions(options = {}) {
    const state = getGameState();
    if (!state || state._runningStateBasedActions) return { destroyed: [], repairs: [] };
    state._runningStateBasedActions = true;
    try {
      for (const unit of allUnits()) normalizeUnitState(unit);
      const repairs = repairMountRelationships({ log: options.logRepairs });
      const destroyed = destroyLethalUnits(options);
      const postRepairs = repairMountRelationships({ log: options.logRepairs });
      if (typeof global.refreshConstructRanges === "function") {
        global.refreshConstructRanges({ reason: options.reason ?? "state-based-actions", render: false, animate: false });
      } else if (typeof global.checkConcealedDetection === "function") {
        global.checkConcealedDetection({ reason: options.reason ?? "state-based-actions", render: false });
      }
      if ((destroyed.length || repairs.length || postRepairs.length) && options.render !== false && typeof global.renderGame === "function") {
        global.renderGame();
      }
      return { destroyed, repairs: repairs.concat(postRepairs) };
    } finally {
      state._runningStateBasedActions = false;
    }
  }

  function handleControlChange(unit, newController, options = {}) {
    if (!unit || !Number.isFinite(Number(newController))) return false;
    unit.controller = Number(newController);
    repairMountRelationships({ log: options.log !== false });
    runStateBasedActions({ reason: "control-changed", render: options.render });
    if (typeof global.emitGameEvent === "function") {
      global.emitGameEvent("unitControlChanged", { unit, controller: unit.controller }, { source: options.source ?? unit });
    }
    return true;
  }

  const originalDestroyUnit = global.destroyUnit;
  if (typeof originalDestroyUnit === "function") {
    global.destroyUnit = function cleanedDestroyUnit(unit, options = {}) {
      const result = originalDestroyUnit(unit, options);
      if (result && options.skipStateCheck !== true) {
        runStateBasedActions({ reason: "unit-destroyed", source: options.source ?? unit, render: false });
      }
      return result;
    };
  }

  const originalApplyCombatDamage = global.applyUnitCombatDamage;
  if (typeof originalApplyCombatDamage === "function") {
    global.applyUnitCombatDamage = function cleanedApplyUnitCombatDamage(...args) {
      const result = originalApplyCombatDamage(...args);
      runStateBasedActions({ reason: "combat-damage", source: args[0], render: false });
      return result;
    };
  }

  Object.assign(global, {
    validateMountedPair,
    repairMountRelationships,
    normalizeUnitState,
    runStateBasedActions,
    handleControlChange,
    handleUnitControlChange: handleControlChange,
  });
})(window);
