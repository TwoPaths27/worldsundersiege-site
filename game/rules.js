"use strict";

// Module 8: Rules Engine
// Pure or state-focused gameplay rules live here. Rendering, animation,
// audio, and input handling remain in their owning modules.

function greatestCommonDivisor(a, b) {
  let first = Math.abs(a);
  let second = Math.abs(b);

  while (second !== 0) {
    const remainder = first % second;
    first = second;
    second = remainder;
  }

  return first;
}

function isUnitProtected(attacker, target) {
  if (!attacker || !target) {
    return false;
  }

  const deltaX = target.x - attacker.x;
  const deltaY = target.y - attacker.y;
  const steps = greatestCommonDivisor(Math.abs(deltaX), Math.abs(deltaY));

  if (steps <= 1) {
    return false;
  }

  const stepX = deltaX / steps;
  const stepY = deltaY / steps;

  for (let step = 1; step < steps; step += 1) {
    if (getUnitAt(attacker.x + stepX * step, attacker.y + stepY * step)) {
      return true;
    }
  }

  return false;
}

function isStrongholdLaneProtected(attacker, strongholdColumn, defenderOwner) {
  const strongholdY = defenderOwner === 1 ? BOARD_ROWS : -1;
  const deltaX = strongholdColumn - attacker.x;
  const deltaY = strongholdY - attacker.y;
  const steps = greatestCommonDivisor(Math.abs(deltaX), Math.abs(deltaY));

  if (steps <= 1) {
    return false;
  }

  const stepX = deltaX / steps;
  const stepY = deltaY / steps;

  for (let step = 1; step < steps; step += 1) {
    if (getUnitAt(attacker.x + stepX * step, attacker.y + stepY * step)) {
      return true;
    }
  }

  return false;
}

function findAttackableUnits(unit) {
  const targets = new Set();

  if (!unit || unit.hasAttacked) {
    return targets;
  }

  for (const candidate of GameState.units) {
    if (candidate.owner === unit.owner) {
      continue;
    }

    const distance = Math.abs(candidate.x - unit.x) + Math.abs(candidate.y - unit.y);
    const isWithinRange = distance > 0 && distance <= unit.currentRange;

    if (isWithinRange && !isUnitProtected(unit, candidate)) {
      targets.add(candidate.id);
    }
  }

  return targets;
}

function findAttackableStronghold(unit) {
  if (!unit || unit.hasAttacked || GameState.gameOver) {
    return null;
  }

  const enemyPlayerId = unit.owner === 1 ? 2 : 1;
  const strongholdY = enemyPlayerId === 2 ? -1 : BOARD_ROWS;

  for (const column of [2, 3, 4]) {
    const distance = Math.abs(unit.x - column) + Math.abs(unit.y - strongholdY);

    if (
      distance > 0 &&
      distance <= unit.currentRange &&
      !isStrongholdLaneProtected(unit, column, enemyPlayerId)
    ) {
      return enemyPlayerId;
    }
  }

  return null;
}

function canUnitRetaliate(attacker, defender) {
  if (!attacker || !defender) {
    return false;
  }

  const distance = Math.abs(attacker.x - defender.x) + Math.abs(attacker.y - defender.y);
  return distance > 0 && distance <= defender.currentRange;
}

function applyUnitCombatDamage(attacker, defender, canRetaliate) {
  defender.currentHP -= attacker.currentAttack;

  if (canRetaliate) {
    attacker.currentHP -= defender.currentAttack;
  }

  attacker.hasAttacked = true;

  return {
    attackerDestroyed: attacker.currentHP <= 0,
    defenderDestroyed: defender.currentHP <= 0,
  };
}

function destroyUnit(unit) {
  if (!unit || !GameState.units.some((candidate) => candidate.id === unit.id)) {
    return false;
  }

  GameState.players[unit.owner].discardCount += 1;
  GameState.units = GameState.units.filter((candidate) => candidate.id !== unit.id);

  if (GameState.selectedUnitId === unit.id) {
    GameState.selectedUnitId = null;
  }

  return true;
}

function applyStrongholdDamage(targetPlayerId, amount) {
  const targetPlayer = GameState.players[targetPlayerId];
  const damage = Math.max(0, Number(amount) || 0);
  targetPlayer.strongholdHP = Math.max(0, targetPlayer.strongholdHP - damage);

  return {
    damage,
    remainingHP: targetPlayer.strongholdHP,
    destroyed: targetPlayer.strongholdHP <= 0,
  };
}

function applyTemporaryRangeBonus(unit, amount) {
  if (!unit) {
    return 0;
  }

  unit.temporaryRangeBonus = (unit.temporaryRangeBonus ?? 0) + amount;
  unit.currentRange = unit.printedRange + unit.temporaryRangeBonus;
  return unit.currentRange;
}
