"use strict";

/* Worlds Under Siege — v19.2 Mount core and movement integration. */
(function mountModule(global) {
  function getGameState() {
    if (global?.GameState) return global.GameState;
    if (typeof GameState !== "undefined") return GameState;
    return null;
  }

  function idOf(unit) {
    return unit?.id ?? unit?.instanceId ?? null;
  }

  function unitById(id) {
    if (!id) return null;
    if (typeof global.getUnitById === "function") return global.getUnitById(id);
    return getGameState()?.units?.find((unit) => idOf(unit) === id) ?? null;
  }

  function initializeMountState(unit) {
    if (!unit || typeof unit !== "object") return unit;
    unit.mountedOn ??= null;
    unit.riderId ??= null;
    unit.mountChangeUsed ??= false;
    return unit;
  }

  function isMounted(unit) {
    initializeMountState(unit);
    return Boolean(unit?.mountedOn);
  }

  function getMount(unit) {
    return isMounted(unit) ? unitById(unit.mountedOn) : null;
  }

  function getRider(unit) {
    initializeMountState(unit);
    return unit?.riderId ? unitById(unit.riderId) : null;
  }

  function hasMountCharacteristic(unit) {
    if (!unit) return false;
    if (typeof global.hasCharacteristic === "function") {
      return global.hasCharacteristic(unit, "Mount");
    }
    const characteristics = Array.isArray(unit.characteristics)
      ? unit.characteristics
      : [];
    return characteristics.some(
      (characteristic) => String(characteristic).trim().toLowerCase() === "mount"
    );
  }

  function isMount(unit) {
    return Boolean(unit && hasMountCharacteristic(unit));
  }

  function isCharacterUnit(unit) {
    if (!unit) return false;
    if (typeof global.isCharacter === "function") return global.isCharacter(unit);
    return unit.type === "Character" || unit.cardType === "Character" || unit.types?.includes?.("Character");
  }

  function isAnimalUnit(unit) {
    if (!unit) return false;
    if (typeof global.isAnimal === "function") return global.isAnimal(unit);
    return unit.type === "Animal" || unit.cardType === "Animal" || unit.types?.includes?.("Animal");
  }

  function isConstructUnit(unit) {
    if (!unit) return false;
    if (typeof global.isConstruct === "function") return global.isConstruct(unit);
    return unit.type === "Construct" || unit.cardType === "Construct" || unit.types?.includes?.("Construct");
  }

  function adjacent(first, second) {
    if (!first || !second) return false;
    const dx = Math.abs(Number(first.x) - Number(second.x));
    const dy = Math.abs(Number(first.y) - Number(second.y));
    return Math.max(dx, dy) === 1;
  }

  function canMount(character, mount, options = {}) {
    initializeMountState(character);
    initializeMountState(mount);

    if (!character || !mount || character === mount) return false;
    if (!isCharacterUnit(character) && options.allowNonCharacter !== true) return false;
    if (!(isAnimalUnit(mount) || isConstructUnit(mount)) && options.allowOtherMountType !== true) return false;
    if (!isMount(mount)) return false;
    if (Number(character.controller ?? character.owner) !== Number(mount.controller ?? mount.owner) && options.allowEnemyMount !== true) return false;
    if (character.isConcealed || mount.isConcealed) return false;
    if (isMounted(character) || mount.riderId) return false;
    if (character.mountChangeUsed) return false;
    if (!adjacent(character, mount) && options.ignoreAdjacency !== true) return false;
    return true;
  }

  function mountCharacter(character, mount, options = {}) {
    if (!canMount(character, mount, options)) return false;

    // Capture the rider and Mount positions before state/render changes so the
    // Character can visibly fly into the mounted tile like an equipped Item.
    const finishMountAnimation = options.animate !== false && typeof global.prepareMountEquipAnimation === "function"
      ? global.prepareMountEquipAnimation(character, mount)
      : null;

    const characterId = idOf(character);
    const mountId = idOf(mount);
    if (!characterId || !mountId) return false;

    const spent = Math.max(
      0,
      Number(character.movementSpent ?? 0),
      Number(mount.movementSpent ?? 0)
    );

    character.mountedOn = mountId;
    mount.riderId = characterId;
    character.mountChangeUsed = true;
    character.x = mount.x;
    character.y = mount.y;
    character.movementSpent = spent;
    mount.movementSpent = spent;

    if (typeof global.getRemainingEffectiveSpeed === "function") {
      character.remainingSpeed = global.getRemainingEffectiveSpeed(character);
      mount.remainingSpeed = global.getRemainingEffectiveSpeed(mount);
    }

    if (typeof global.emitGameEvent === "function") {
      global.emitGameEvent("unitMounted", { character, mount }, { source: character });
    }
    if (typeof global.checkConcealedDetection === "function") {
      global.checkConcealedDetection({ reason: "mount" });
    }
    if (typeof global.renderGame === "function" && options.render !== false) {
      global.renderGame();
    }
    if (typeof finishMountAnimation === "function") {
      requestAnimationFrame(() => requestAnimationFrame(finishMountAnimation));
    } else if (typeof global.animateUnitMounted === "function" && options.animate !== false) {
      global.animateUnitMounted(character, mount);
    }
    return true;
  }

  function canDismount(character, targetSquare = null) {
    initializeMountState(character);
    if (!character || !isMounted(character) || character.mountChangeUsed || character.isConcealed) return false;
    const mount = getMount(character);
    if (!mount) return false;
    if (!targetSquare) return true;

    const dx = Math.abs(Number(targetSquare.x) - Number(mount.x));
    const dy = Math.abs(Number(targetSquare.y) - Number(mount.y));
    if (Math.max(dx, dy) !== 1) return false;
    if (typeof global.getUnitAt === "function" && global.getUnitAt(targetSquare.x, targetSquare.y)) return false;
    return true;
  }

  function dismountCharacter(character, targetSquare, options = {}) {
    if (!canDismount(character, targetSquare)) return false;
    const mount = getMount(character);
    if (!mount) return false;

    mount.riderId = null;
    character.mountedOn = null;
    character.mountChangeUsed = true;
    character.x = Number(targetSquare.x);
    character.y = Number(targetSquare.y);

    const spent = Math.max(Number(character.movementSpent ?? 0), Number(mount.movementSpent ?? 0));
    character.movementSpent = spent;
    if (typeof global.getRemainingEffectiveSpeed === "function") {
      character.remainingSpeed = global.getRemainingEffectiveSpeed(character);
      mount.remainingSpeed = global.getRemainingEffectiveSpeed(mount);
    }

    if (typeof global.emitGameEvent === "function") {
      global.emitGameEvent("unitDismounted", { character, mount, to: targetSquare }, { source: character });
    }
    if (typeof global.checkConcealedDetection === "function") {
      global.checkConcealedDetection({ reason: "dismount" });
    }
    if (typeof global.renderGame === "function" && options.render !== false) {
      global.renderGame();
    }
    if (typeof global.animateUnitDismounted === "function" && options.animate !== false) {
      global.animateUnitDismounted(character, mount);
    }
    return true;
  }

  function getMovementUnit(unit) {
    return getMount(unit) ?? unit;
  }

  function syncMountedPairPosition(unit) {
    initializeMountState(unit);
    const rider = getRider(unit);
    if (rider) {
      rider.x = unit.x;
      rider.y = unit.y;
      rider.movementSpent = Number(unit.movementSpent ?? 0);
      if (typeof global.getRemainingEffectiveSpeed === "function") {
        rider.remainingSpeed = global.getRemainingEffectiveSpeed(rider);
      }
    }
  }

  function resetMountChangesForPlayer(playerId) {
    for (const unit of getGameState()?.units ?? []) {
      if (Number(unit.controller ?? unit.owner) === Number(playerId)) {
        initializeMountState(unit);
        unit.mountChangeUsed = false;
      }
    }
  }

  const api = {
    initializeMountState,
    isMounted,
    getMount,
    getRider,
    isMount,
    canMount,
    mountCharacter,
    canDismount,
    dismountCharacter,
    getMovementUnit,
    syncMountedPairPosition,
    resetMountChangesForPlayer,
  };

  global.MountEngine = api;
  Object.assign(global, api);
})(window);
