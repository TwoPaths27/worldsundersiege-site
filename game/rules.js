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

function findAttackableUnits(unit, { ignoreAttackSpent = false } = {}) {
  const targets = new Set();

  if (
    !unit ||
    !canAttack(unit) ||
    (!ignoreAttackSpent && unit.hasAttacked) ||
    (typeof hasStatus === "function" &&
      (hasStatus(unit, StatusTypes.STUNNED) ||
       hasStatus(unit, StatusTypes.FROZEN)))
  ) {
    return targets;
  }

  for (const candidate of GameState.units) {
    if (candidate.owner === unit.owner) {
      continue;
    }

    const distance = Math.abs(candidate.x - unit.x) + Math.abs(candidate.y - unit.y);
    const isWithinRange = distance > 0 && distance <= (typeof getCurrentRange === "function" ? getCurrentRange(unit) : unit.currentRange);

    if (isWithinRange && !isUnitProtected(unit, candidate)) {
      targets.add(candidate.id);
    }
  }

  return targets;
}

function findAttackableStronghold(unit, { ignoreAttackSpent = false } = {}) {
  if (!unit || !canAttack(unit) || (!ignoreAttackSpent && unit.hasAttacked) || GameState.gameOver) {
    return null;
  }

  const enemyPlayerId = unit.owner === 1 ? 2 : 1;
  const strongholdY = enemyPlayerId === 2 ? -1 : BOARD_ROWS;

  for (const column of [2, 3, 4]) {
    const distance = Math.abs(unit.x - column) + Math.abs(unit.y - strongholdY);

    if (
      distance > 0 &&
      distance <= (typeof getCurrentRange === "function" ? getCurrentRange(unit) : unit.currentRange) &&
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

  if (typeof canMountedUnitRetaliate === "function" && !canMountedUnitRetaliate(defender)) {
    return false;
  }

  const distance = Math.abs(attacker.x - defender.x) + Math.abs(attacker.y - defender.y);
  return distance > 0 && distance <= (typeof getCurrentRange === "function" ? getCurrentRange(defender) : defender.currentRange);
}

function applyUnitCombatDamage(attacker, defender, canRetaliate) {
  if (typeof applyMountedCombatDamage === "function") {
    return applyMountedCombatDamage(attacker, defender, canRetaliate);
  }

  defender.currentHP -= (typeof getCurrentAttack === "function" ? getCurrentAttack(attacker) : attacker.currentAttack);

  if (canRetaliate) {
    attacker.currentHP -= (typeof getCurrentAttack === "function" ? getCurrentAttack(defender) : defender.currentAttack);
  }

  attacker.hasAttacked = true;

  return {
    attackerDestroyed: attacker.currentHP <= 0,
    defenderDestroyed: defender.currentHP <= 0,
  };
}

function destroyUnit(unit, options = {}) {
  if (!unit || !GameState.units.some((candidate) => candidate.id === unit.id)) return false;
  if (typeof prepareMountedUnitForDestruction === "function") {
    prepareMountedUnitForDestruction(unit);
  }
  const source = options.source ?? unit;
  const cause = options.cause ?? "destroyed";
  const owner = GameState.players[unit.owner] ?? null;

  emitGameEvent("unitLeavingPlay", { unit, ownerId: unit.owner, cause, source }, { source });
  if (owner) owner.discardCount = (owner.discardCount ?? 0) + 1;

  GameState.units = GameState.units.filter((candidate) => candidate.id !== unit.id);
  if (GameState.selectedUnitId === unit.id) GameState.selectedUnitId = null;

  emitGameEvent("unitDestroyed", { unit, ownerId: unit.owner, cause, source }, { source });
  leavePermanent(unit, { cause, source, destroyed: true });

  if (typeof updateContinuousEffects === "function") updateContinuousEffects({ phase: "stateCheck" });
  emitGameEvent("unitLeftPlay", { unit, ownerId: unit.owner, cause, source }, { source });
  if (typeof checkConcealedDetection === "function") checkConcealedDetection({ reason: "unit-left-play" });
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
  if (!unit) return 0;

  if (typeof addContinuousEffect === "function") {
    addContinuousEffect({
      source: unit,
      controller: unit.owner,
      target: unit.id,
      layer: ModifierLayers.BUFF,
      duration: "untilEndOfTurn",
      expiresForPlayer: GameState.activePlayer,
      modifier(stats) {
        stats.range += Number(amount) || 0;
      },
      metadata: {
        kind: "temporary-range-bonus",
        amount: Number(amount) || 0,
      },
    });

    return getCurrentRange(unit);
  }

  unit.temporaryRangeBonus = (unit.temporaryRangeBonus ?? 0) + amount;
  unit.currentRange = unit.printedRange + unit.temporaryRangeBonus;
  if (typeof checkConcealedDetection === "function") checkConcealedDetection({ reason: "range-changed" });
  return unit.currentRange;
}


/* v16 — Item attachment and equipment rules */
function getAttachedItems(hostOrId) {
  const hostId = typeof hostOrId === "object" ? hostOrId?.id : hostOrId;
  if (!hostId) return [];
  return (GameState.items ?? []).filter((item) => item.attachedToId === hostId);
}

function getItemStatModifier(item) {
  const modifiers = item?.modifiers && typeof item.modifiers === "object"
    ? item.modifiers
    : {};
  return {
    attack: Number(modifiers.attack ?? item?.attackBonus ?? 0) || 0,
    hp: Number(modifiers.hp ?? item?.hpBonus ?? 0) || 0,
    range: Number(modifiers.range ?? item?.rangeBonus ?? 0) || 0,
    speed: Number(modifiers.speed ?? item?.speedBonus ?? 0) || 0,
  };
}

function canAttachItemToHost(item, host, context = {}) {
  if (host?.isConcealed) return false;
  if (!itemCanAttachTo(item, host, { game: GameState, ...context })) return false;
  const rule = getItemAttachmentRule(item);
  return getAttachedItems(host).length < rule.maxPerHost;
}

function registerItemModifier(item, host) {
  if (typeof addContinuousEffect !== "function") return null;
  const bonus = getItemStatModifier(item);
  if (!bonus.attack && !bonus.hp && !bonus.range && !bonus.speed) return null;

  const effect = addContinuousEffect({
    id: `item-effect-${item.id}`,
    source: item,
    controller: item.owner,
    target: host.id,
    layer: ModifierLayers.EQUIPMENT,
    duration: "permanent",
    expiresWithSource: true,
    modifier(stats) {
      stats.attack += bonus.attack;
      stats.maxHP += bonus.hp;
      stats.range += bonus.range;
      stats.speed += bonus.speed;
    },
    metadata: { kind: "equipment", itemId: item.id, hostId: host.id },
  });

  item.continuousEffectId = effect.id;
  if (bonus.hp > 0) host.currentHP += bonus.hp;
  return effect;
}

function attachItem(item, host, options = {}) {
  if (!canAttachItemToHost(item, host, options)) return false;
  GameState.items ??= [];
  item.owner ??= host.owner;
  item.controller = host.owner;
  item.attachedToId = host.id;
  item.attachedTo = host.id;
  normalizePermanent(item, { owner: item.owner, controller: item.controller });
  GameState.items.push(item);
  enterPermanent(item, { owner: item.owner, controller: item.controller, cause: "attached" });
  registerItemModifier(item, host);
  emitGameEvent("itemAttached", { item, host, playerId: item.owner }, { source: item });
  if (typeof updateContinuousEffects === "function") updateContinuousEffects({ phase: "stateCheck" });
  return true;
}

function destroyItem(item, options = {}) {
  if (!item || !(GameState.items ?? []).some((candidate) => candidate.id === item.id)) return false;
  const host = getUnitById(item.attachedToId);
  const event = emitGameEvent("itemWouldBeDestroyed", {
    item, host, cause: options.cause ?? "destroyed", source: options.source ?? item,
  }, { source: options.source ?? item });
  if (event.cancelled) return false;

  GameState.items = GameState.items.filter((candidate) => candidate.id !== item.id);
  leavePermanent(item, { cause: options.cause ?? "item-destroyed", source: options.source ?? item, destroyed: true });
  item.attachedToId = null;
  item.attachedTo = null;
  const owner = GameState.players[item.owner];
  if (owner) owner.discardCount = (owner.discardCount ?? 0) + 1;
  if (host && typeof getCurrentMaxHP === "function") host.currentHP = Math.min(host.currentHP, getCurrentMaxHP(host));
  emitGameEvent("itemDestroyed", { item, host, cause: options.cause ?? "destroyed" }, { source: options.source ?? item });
  return true;
}

function destroyItemsAttachedTo(host, options = {}) {
  const items = [...getAttachedItems(host)];
  for (const item of items) destroyItem(item, { cause: options.cause ?? "host-left-play", source: options.source ?? host });
  return items.length;
}

/* v15 — Construct operation rules */
function getOrthogonallyAdjacentUnits(source) {
  if (!source) return [];

  return GameState.units.filter((candidate) =>
    candidate.id !== source.id &&
    Math.abs(candidate.x - source.x) + Math.abs(candidate.y - source.y) === 1
  );
}

function getEligibleConstructOperators(construct) {
  if (!construct || !isConstruct(construct)) return [];

  return getOrthogonallyAdjacentUnits(construct).filter((candidate) =>
    candidate.owner === construct.owner &&
    canBeConstructOperator(candidate) &&
    !candidate.hasAttacked &&
    !(typeof hasStatus === "function" &&
      (hasStatus(candidate, StatusTypes.STUNNED) ||
       hasStatus(candidate, StatusTypes.FROZEN)))
  );
}

function canOperateConstruct(operator, construct) {
  if (!operator || !construct || !isConstruct(construct)) return false;
  return getEligibleConstructOperators(construct)
    .some((candidate) => candidate.id === operator.id);
}

function constructHasLegalAttackTarget(construct) {
  if (!construct || !isConstruct(construct) || GameState.gameOver) return false;
  if (getEligibleConstructOperators(construct).length === 0) return false;

  return (
    findConstructAttackableUnits(construct).size > 0 ||
    findConstructAttackableStronghold(construct) !== null
  );
}

function findConstructAttackableUnits(construct) {
  const targets = new Set();
  if (!construct || !isConstruct(construct)) return targets;

  for (const candidate of GameState.units) {
    if (candidate.owner === construct.owner) continue;

    const distance = Math.abs(candidate.x - construct.x) + Math.abs(candidate.y - construct.y);
    const range = typeof getCurrentRange === "function"
      ? getCurrentRange(construct)
      : construct.currentRange;

    if (distance > 0 && distance <= range && !isUnitProtected(construct, candidate)) {
      targets.add(candidate.id);
    }
  }

  return targets;
}

function findConstructAttackableStronghold(construct) {
  if (!construct || !isConstruct(construct) || GameState.gameOver) return null;

  const enemyPlayerId = construct.owner === 1 ? 2 : 1;
  const strongholdY = enemyPlayerId === 2 ? -1 : BOARD_ROWS;
  const range = typeof getCurrentRange === "function"
    ? getCurrentRange(construct)
    : construct.currentRange;

  for (const column of [2, 3, 4]) {
    const distance = Math.abs(construct.x - column) + Math.abs(construct.y - strongholdY);
    if (
      distance > 0 &&
      distance <= range &&
      !isStrongholdLaneProtected(construct, column, enemyPlayerId)
    ) {
      return enemyPlayerId;
    }
  }

  return null;
}

function consumeConstructOperatorAttack(operator, construct) {
  if (!canOperateConstruct(operator, construct)) return false;
  operator.hasAttacked = true;
  return true;
}
