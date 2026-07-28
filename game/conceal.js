"use strict";

/* Worlds Under Siege — v18.9 Conceal engine (Pass 2). */

function isNaturallyConcealable(card) {
  if (!card) return false;
  return Boolean(
    (typeof isCharacter === "function" && isCharacter(card)) ||
    (typeof isAnimal === "function" && isAnimal(card)) ||
    card.type === "Character" || card.cardType === "Character" || card.types?.includes?.("Character") ||
    card.type === "Animal" || card.cardType === "Animal" || card.types?.includes?.("Animal")
  );
}

function canPlayConcealed(card) {
  return isNaturallyConcealable(card);
}

function initializeConcealState(unit) {
  if (!unit || typeof unit !== "object") return unit;
  unit.isConcealed ??= false;
  unit.concealedCost ??= 0;
  unit.concealSource ??= null;
  unit.movementSpent ??= Math.max(0, Number(unit.currentSpeed ?? unit.printedSpeed ?? 0) - Number(unit.remainingSpeed ?? unit.currentSpeed ?? unit.printedSpeed ?? 0));
  unit.wasRevealed ??= false;
  return unit;
}

function getEffectiveSpeed(unit) {
  initializeConcealState(unit);
  if (unit?.isConcealed) return 1;
  if (typeof getMount === "function") {
    const mount = getMount(unit);
    if (mount) return Number(mount.currentSpeed ?? mount.printedSpeed ?? mount.speed ?? 0);
  }
  return Number(unit?.currentSpeed ?? unit?.printedSpeed ?? unit?.speed ?? 0);
}

function getEffectiveRange(unit) {
  initializeConcealState(unit);
  if (unit?.isConcealed) return 0;
  const baseRange = Number(unit?.currentRange ?? unit?.printedRange ?? unit?.range ?? 0);
  if (typeof getConstructAdjustedRange === "function") {
    return getConstructAdjustedRange(unit, baseRange);
  }
  return baseRange;
}

function getRemainingEffectiveSpeed(unit) {
  initializeConcealState(unit);
  return Math.max(0, getEffectiveSpeed(unit) - Number(unit?.movementSpent ?? 0));
}

function isVisibleToPlayer(unit, playerId) {
  initializeConcealState(unit);
  return !unit?.isConcealed || Number(unit.owner ?? unit.controller) === Number(playerId);
}

function canInteractWithUnit(source, target, options = {}) {
  if (!target) return false;
  initializeConcealState(target);
  if (target.isConcealed && options.allowConcealed !== true) return false;
  return true;
}

function getConcealUnitById(id) {
  if (!id || typeof GameState === "undefined") return null;
  return (GameState.units ?? []).find((unit) => unit.id === id) ?? null;
}

function getMountedPartner(unit) {
  if (!unit) return null;
  const partnerId = unit.mountedUnitId ?? unit.mountId ?? unit.riderId ?? unit.mountedToId ?? null;
  if (partnerId) return getConcealUnitById(partnerId);
  return (GameState?.units ?? []).find((candidate) =>
    candidate.id !== unit.id &&
    [candidate.mountedUnitId, candidate.mountId, candidate.riderId, candidate.mountedToId].includes(unit.id)
  ) ?? null;
}

function clearMountRelationship(first, second) {
  for (const unit of [first, second]) {
    if (!unit) continue;
    unit.mountedUnitId = null;
    unit.mountId = null;
    unit.riderId = null;
    unit.mountedToId = null;
    unit.isMounted = false;
  }
}

function getOpenAdjacentSpaces(unit) {
  if (!unit || typeof GameState === "undefined") return [];
  const candidates = [
    { x: unit.x, y: unit.y - 1 },
    { x: unit.x + 1, y: unit.y },
    { x: unit.x, y: unit.y + 1 },
    { x: unit.x - 1, y: unit.y },
  ];
  return candidates.filter(({ x, y }) =>
    x >= 0 && y >= 0 &&
    x < (typeof BOARD_COLUMNS === "number" ? BOARD_COLUMNS : 7) &&
    y < (typeof BOARD_ROWS === "number" ? BOARD_ROWS : 6) &&
    !(GameState.units ?? []).some((candidate) => candidate.x === x && candidate.y === y)
  );
}

function separateMountedUnitForConceal(unit, options = {}) {
  const partner = getMountedPartner(unit);
  if (!partner) return { separated: false, partner: null, destroyed: false };

  clearMountRelationship(unit, partner);
  const spaces = getOpenAdjacentSpaces(unit);
  if (!spaces.length) {
    if (typeof destroyUnit === "function") {
      destroyUnit(partner, { cause: "conceal-no-adjacent-space", source: options.source ?? unit });
    }
    if (typeof addLog === "function") addLog(`${partner.name} was destroyed because there was no adjacent space after dismounting.`);
    return { separated: true, partner, destroyed: true };
  }

  let destination = spaces[0];
  if (typeof options.chooseMountSpace === "function") {
    destination = options.chooseMountSpace(spaces, partner, unit) ?? destination;
  }
  partner.x = destination.x;
  partner.y = destination.y;
  if (typeof addLog === "function") addLog(`${partner.name} was separated and placed at ${typeof formatCoordinate === "function" ? formatCoordinate(partner.x, partner.y) : `${partner.x},${partner.y}`}.`);
  return { separated: true, partner, destroyed: false, destination };
}

function destroyEquipmentForConceal(unit, options = {}) {
  if (typeof destroyItemsAttachedTo !== "function") return 0;
  return destroyItemsAttachedTo(unit, {
    cause: "host-became-concealed",
    source: options.source ?? unit,
  });
}

function concealUnit(unit, source = "effect", options = {}) {
  if (!unit || !isNaturallyConcealable(unit) || unit.isConcealed) return false;
  initializeConcealState(unit);

  /* Concealing a mounted/equipped unit always strips those relationships first. */
  separateMountedUnitForConceal(unit, { ...options, source: options.source ?? unit });
  destroyEquipmentForConceal(unit, { ...options, source: options.source ?? unit });

  unit.isConcealed = true;
  unit.concealSource = source;
  if (Number.isFinite(Number(options.costPaid))) unit.concealedCost = Number(options.costPaid);
  else if (!Number.isFinite(Number(unit.concealedCost)) || Number(unit.concealedCost) < 0) unit.concealedCost = 0;
  unit.movementSpent = Math.max(0, Number(unit.currentSpeed ?? unit.printedSpeed ?? 0) - Number(unit.remainingSpeed ?? unit.currentSpeed ?? unit.printedSpeed ?? 0));
  unit.remainingSpeed = getRemainingEffectiveSpeed(unit);

  if (typeof emitGameEvent === "function") {
    emitGameEvent("unitConcealed", { unit, source, playerId: unit.owner }, { source: options.source ?? unit });
  }
  if (typeof addLog === "function" && options.silent !== true) addLog(`${unit.name} became concealed.`);

  if (options.checkDetection !== false) checkConcealedDetection({ reason: "became-concealed", render: false });
  if (typeof renderGame === "function" && options.render !== false) renderGame();
  return true;
}

function revealUnit(unit, reason = "manual", options = {}) {
  if (!unit?.isConcealed) return false;
  initializeConcealState(unit);
  unit.isConcealed = false;
  unit.wasRevealed = true;
  unit.lastRevealReason = reason;
  unit.remainingSpeed = Math.max(0, Number(unit.currentSpeed ?? unit.printedSpeed ?? 0) - Number(unit.movementSpent ?? 0));

  if (typeof emitGameEvent === "function") {
    emitGameEvent("unitRevealed", { unit, reason, playerId: unit.owner }, { source: unit });
  }
  if (typeof addLog === "function" && options.silent !== true) addLog(`${unit.name} was revealed${reason ? ` (${reason})` : ""}.`);
  if (typeof renderGame === "function" && options.render !== false) renderGame();
  return true;
}

function getConcealDistance(first, second) {
  return Math.abs(Number(first.x) - Number(second.x)) + Math.abs(Number(first.y) - Number(second.y));
}

function findDetectorForConcealedUnit(concealedUnit) {
  if (!concealedUnit?.isConcealed || typeof GameState === "undefined") return null;
  const owner = Number(concealedUnit.owner ?? concealedUnit.controller);
  return (GameState.units ?? []).find((candidate) => {
    if (!candidate || candidate.id === concealedUnit.id) return false;
    if (Number(candidate.owner ?? candidate.controller) === owner) return false;
    const range = getEffectiveRange(candidate);
    return range > 0 && getConcealDistance(candidate, concealedUnit) <= range;
  }) ?? null;
}

function checkConcealedDetection(options = {}) {
  if (typeof GameState === "undefined" || !Array.isArray(GameState.units)) return [];
  const revealed = [];
  let safety = Math.max(1, GameState.units.length + 1);
  let changed = true;

  /* Repeat because one reveal can restore Range and reveal another unit. */
  while (changed && safety-- > 0) {
    changed = false;
    const concealedUnits = GameState.units.filter((unit) => unit?.isConcealed);
    for (const unit of concealedUnits) {
      const detector = findDetectorForConcealedUnit(unit);
      if (!detector) continue;
      if (revealUnit(unit, options.reason ?? "enemy-range", { render: false })) {
        revealed.push({ unit, detector });
        changed = true;
      }
    }
  }

  if (revealed.length && typeof renderGame === "function" && options.render !== false) renderGame();
  return revealed;
}

window.canPlayConcealed = canPlayConcealed;
window.initializeConcealState = initializeConcealState;
window.concealUnit = concealUnit;
window.revealUnit = revealUnit;
window.getEffectiveSpeed = getEffectiveSpeed;
window.getEffectiveRange = getEffectiveRange;
window.getRemainingEffectiveSpeed = getRemainingEffectiveSpeed;
window.isVisibleToPlayer = isVisibleToPlayer;
window.canInteractWithUnit = canInteractWithUnit;
window.getMountedPartner = getMountedPartner;
window.separateMountedUnitForConceal = separateMountedUnitForConceal;
window.destroyEquipmentForConceal = destroyEquipmentForConceal;
window.checkConcealedDetection = checkConcealedDetection;
