"use strict";

/* Worlds Under Siege — v19.5 Construct Range activation. */
(function constructRangeModule(global) {
  function isConstructUnit(unit) {
    if (!unit) return false;
    if (typeof global.isConstruct === "function") return global.isConstruct(unit);
    return unit.type === "Construct" || unit.cardType === "Construct" || unit.types?.includes?.("Construct");
  }

  function isCharacterUnit(unit) {
    if (!unit) return false;
    if (typeof global.isCharacter === "function") return global.isCharacter(unit);
    return unit.type === "Character" || unit.cardType === "Character" || unit.types?.includes?.("Character");
  }

  function controllerOf(unit) {
    return Number(unit?.controller ?? unit?.owner);
  }

  function isOrthogonallyAdjacent(first, second) {
    if (!first || !second) return false;
    return Math.abs(Number(first.x) - Number(second.x)) + Math.abs(Number(first.y) - Number(second.y)) === 1;
  }

  function isActiveCharacterForConstruct(character, construct) {
    if (!isCharacterUnit(character) || !construct) return false;
    if (character.id === construct.id) return false;
    if (character.isConcealed) return false;
    if (controllerOf(character) !== controllerOf(construct)) return false;

    /* A rider shares its Mount's square; sharing a square is not adjacency. */
    return isOrthogonallyAdjacent(character, construct);
  }

  function getAdjacentFriendlyCharacters(construct) {
    if (!isConstructUnit(construct) || !Array.isArray(global.GameState?.units)) return [];
    return global.GameState.units.filter((unit) => isActiveCharacterForConstruct(unit, construct));
  }

  function hasAdjacentFriendlyCharacter(construct) {
    return getAdjacentFriendlyCharacters(construct).length > 0;
  }

  function isConstructRangeActive(construct) {
    if (!isConstructUnit(construct)) return true;
    if (construct.isConcealed) return false;
    return hasAdjacentFriendlyCharacter(construct);
  }

  function getConstructAdjustedRange(unit, baseRange) {
    const normalized = Math.max(0, Number(baseRange) || 0);
    if (!isConstructUnit(unit)) return normalized;
    return isConstructRangeActive(unit) ? normalized : 0;
  }

  function refreshConstructRanges(options = {}) {
    const changes = [];
    for (const unit of global.GameState?.units ?? []) {
      if (!isConstructUnit(unit)) continue;
      const active = isConstructRangeActive(unit);
      if (unit.constructRangeActive !== active) {
        changes.push({ unit, previous: unit.constructRangeActive, active });
        unit.constructRangeActive = active;
      }
    }

    /* Range is calculated live, but detection must rerun when board relationships change. */
    if (typeof global.checkConcealedDetection === "function" && options.checkDetection !== false) {
      global.checkConcealedDetection({
        reason: options.reason ?? "construct-range-changed",
        render: false,
      });
    }
    if ((changes.length || options.forceRender) && typeof global.renderGame === "function" && options.render !== false) {
      global.renderGame();
    }
    if (options.animate !== false && typeof global.animateConstructRangeChange === "function") {
      for (const change of changes) {
        global.animateConstructRangeChange(change.unit, change.active);
      }
    }
    return changes;
  }

  const api = {
    isConstructUnit,
    isCharacterUnitForConstructRange: isCharacterUnit,
    isOrthogonallyAdjacent,
    getAdjacentFriendlyCharacters,
    hasAdjacentFriendlyCharacter,
    isConstructRangeActive,
    getConstructAdjustedRange,
    refreshConstructRanges,
  };

  global.ConstructRangeEngine = api;
  Object.assign(global, api);
})(window);
