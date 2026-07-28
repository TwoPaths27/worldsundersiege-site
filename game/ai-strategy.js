"use strict";

/* Worlds Under Siege — v19.6 tactical AI helpers.
 *
 * This module does not replace the turn controller. It provides deterministic
 * scoring and action-selection helpers that existing or future AI controllers
 * can call for Conceal, Mount, mounted combat, and Construct positioning.
 */
(function aiStrategyModule(global) {
  const INVALID_SCORE = -1000000;

  function unitsForPlayer(playerId) {
    return (global.GameState?.units ?? []).filter(
      (unit) => Number(unit?.controller ?? unit?.owner) === Number(playerId)
    );
  }

  function idOf(unit) {
    return unit?.id ?? unit?.instanceId ?? null;
  }

  function typeIs(unit, type) {
    if (!unit) return false;
    const normalized = String(type).toLowerCase();
    if (normalized === "character" && typeof global.isCharacter === "function") {
      return global.isCharacter(unit);
    }
    if (normalized === "animal" && typeof global.isAnimal === "function") {
      return global.isAnimal(unit);
    }
    if (normalized === "construct" && typeof global.isConstruct === "function") {
      return global.isConstruct(unit);
    }
    return [unit.type, unit.cardType, ...(unit.types ?? [])]
      .filter(Boolean)
      .some((entry) => String(entry).toLowerCase() === normalized);
  }

  function currentHP(unit) {
    return Math.max(0, Number(unit?.currentHP ?? unit?.hp ?? 0));
  }

  function currentAttack(unit) {
    if (typeof global.getCurrentAttack === "function") {
      return Math.max(0, Number(global.getCurrentAttack(unit)) || 0);
    }
    return Math.max(0, Number(unit?.currentAttack ?? unit?.attack ?? 0));
  }

  function effectiveSpeed(unit) {
    if (typeof global.getEffectiveSpeed === "function") {
      return Math.max(0, Number(global.getEffectiveSpeed(unit)) || 0);
    }
    return Math.max(0, Number(unit?.currentSpeed ?? unit?.speed ?? 0));
  }

  function effectiveRange(unit) {
    if (typeof global.getEffectiveRange === "function") {
      return Math.max(0, Number(global.getEffectiveRange(unit)) || 0);
    }
    return Math.max(0, Number(unit?.currentRange ?? unit?.range ?? 0));
  }

  function distance(first, second) {
    if (!first || !second) return Infinity;
    return Math.abs(Number(first.x) - Number(second.x)) +
      Math.abs(Number(first.y) - Number(second.y));
  }

  function adjacentUnits(unit) {
    return (global.GameState?.units ?? []).filter(
      (candidate) => candidate && candidate !== unit && distance(unit, candidate) === 1
    );
  }

  function enemyUnits(playerId) {
    return (global.GameState?.units ?? []).filter(
      (unit) => Number(unit?.controller ?? unit?.owner) !== Number(playerId)
    );
  }

  function hasAttackTarget(unit) {
    if (!unit || unit.isConcealed) return false;
    const playerId = Number(unit.controller ?? unit.owner);
    const range = effectiveRange(unit);
    return enemyUnits(playerId).some((enemy) => {
      if (!enemy || enemy.isConcealed) return false;
      return distance(unit, enemy) <= range;
    });
  }

  function wouldAutoReveal(unit) {
    if (!unit?.isConcealed) return false;
    const playerId = Number(unit.controller ?? unit.owner);
    return enemyUnits(playerId).some((enemy) => {
      const range = effectiveRange(enemy);
      return range > 0 && distance(enemy, unit) <= range;
    });
  }

  function wouldActivateConstruct(character) {
    if (!character || character.isConcealed || !typeIs(character, "Character")) return false;
    const playerId = Number(character.controller ?? character.owner);
    return unitsForPlayer(playerId).some((unit) => {
      if (!typeIs(unit, "Construct") || unit.isConcealed) return false;
      if (unit.riderId === idOf(character)) return false;
      return distance(character, unit) === 1 && effectiveRange(unit) === 0;
    });
  }

  function scoreMountAction(character, mount) {
    if (typeof global.canMount !== "function" || !global.canMount(character, mount)) {
      return INVALID_SCORE;
    }

    let score = 12;
    const speedGain = effectiveSpeed(mount) - effectiveSpeed(character);
    score += speedGain * 9;

    const mountHP = currentHP(mount);
    if (mountHP <= 1) score -= 35;
    else if (mountHP === 2) score -= 15;

    if (effectiveRange(character) > 0) score -= 4;
    if (hasAttackTarget(character)) score -= 12;
    if (typeIs(mount, "Construct") && effectiveRange(mount) > 0) score += 4;

    return score;
  }

  function chooseMountAction(playerId) {
    let best = null;
    let bestScore = INVALID_SCORE;
    const friendly = unitsForPlayer(playerId);

    for (const character of friendly) {
      if (!typeIs(character, "Character") || character.isConcealed) continue;
      for (const mount of adjacentUnits(character)) {
        if (Number(mount.controller ?? mount.owner) !== Number(playerId)) continue;
        const score = scoreMountAction(character, mount);
        if (score > bestScore) {
          bestScore = score;
          best = { character, mount, score };
        }
      }
    }

    return bestScore > 0 ? best : null;
  }

  function scoreReveal(unit) {
    if (!unit?.isConcealed) return INVALID_SCORE;
    let score = 0;
    if (hasAttackTarget({ ...unit, isConcealed: false })) score += 40;
    if (wouldActivateConstruct({ ...unit, isConcealed: false })) score += 24;
    if (wouldAutoReveal(unit)) score += 15;
    if (currentHP(unit) <= 1) score -= 8;
    return score;
  }

  function chooseRevealActions(playerId, threshold = 25) {
    return unitsForPlayer(playerId)
      .filter((unit) => unit?.isConcealed)
      .map((unit) => ({ unit, score: scoreReveal(unit) }))
      .filter((entry) => entry.score >= threshold)
      .sort((a, b) => b.score - a.score);
  }

  function chooseMountedDamageTarget(character, mount, damage, source = null) {
    if (!character || !mount) return character ?? mount ?? null;
    const amount = Math.max(0, Number(damage) || 0);
    const characterHP = currentHP(character);
    const mountHP = currentHP(mount);

    const characterLethal = characterHP > 0 && characterHP <= amount;
    const mountLethal = mountHP > 0 && mountHP <= amount;

    if (characterLethal && !mountLethal) return character;
    if (mountLethal && !characterLethal) return mount;
    if (characterLethal && mountLethal) {
      // Remove the rider by default; it normally has greater card and ability value.
      return character;
    }

    let characterScore = currentAttack(character) * 7 + effectiveRange(character) * 5;
    let mountScore = effectiveSpeed(mount) * 7 + currentAttack(mount) * 2;

    if (typeof global.getRider === "function" && global.getRider(mount) === character) {
      mountScore += Math.max(0, effectiveSpeed(mount) - effectiveSpeed(character)) * 6;
    }
    if (source && effectiveRange(source) === 0 && effectiveSpeed(mount) >= 4) mountScore += 5;

    return mountScore > characterScore ? mount : character;
  }

  function shouldRecruitConcealed(card, context = {}) {
    if (!card || (!typeIs(card, "Character") && !typeIs(card, "Animal"))) return false;
    if (context.mustEnterFaceUp || context.needsImmediateAbility) return false;

    const range = Math.max(0, Number(card.currentRange ?? card.printedRange ?? card.range ?? 0));
    const speed = Math.max(0, Number(card.currentSpeed ?? card.printedSpeed ?? card.speed ?? 0));
    const hp = Math.max(0, Number(card.currentHP ?? card.printedHP ?? card.hp ?? 0));

    if (context.enemyCanImmediatelyDetect) return false;
    if (range > 0) return false;
    if (speed <= 1 && hp <= 2) return false;
    return true;
  }

  function scoreConstructActivationPosition(character, construct) {
    if (!character || !construct) return INVALID_SCORE;
    if (!typeIs(character, "Character") || !typeIs(construct, "Construct")) return INVALID_SCORE;
    if (character.isConcealed || construct.isConcealed) return INVALID_SCORE;
    if (Number(character.controller ?? character.owner) !== Number(construct.controller ?? construct.owner)) {
      return INVALID_SCORE;
    }
    if (construct.riderId === idOf(character)) return INVALID_SCORE;

    let score = Number(construct.printedRange ?? construct.currentRange ?? 0) * 12;
    score += currentAttack(construct) * 4;
    score -= distance(character, construct) * 5;
    if (effectiveRange(construct) > 0) score -= 20;
    return score;
  }

  function chooseConstructActivationPlan(playerId) {
    const friendly = unitsForPlayer(playerId);
    const characters = friendly.filter((unit) => typeIs(unit, "Character") && !unit.isConcealed);
    const constructs = friendly.filter((unit) => typeIs(unit, "Construct") && !unit.isConcealed);
    let best = null;
    let bestScore = INVALID_SCORE;

    for (const character of characters) {
      for (const construct of constructs) {
        const score = scoreConstructActivationPosition(character, construct);
        if (score > bestScore) {
          bestScore = score;
          best = { character, construct, score, desiredDistance: 1 };
        }
      }
    }

    return bestScore > 0 ? best : null;
  }

  function executeSimpleMountAction(playerId) {
    const choice = chooseMountAction(playerId);
    if (!choice || typeof global.mountCharacter !== "function") return false;
    const mounted = global.mountCharacter(choice.character, choice.mount);
    if (mounted && typeof global.addLog === "function") {
      global.addLog(`AI mounted ${choice.character.name} on ${choice.mount.name}.`);
    }
    if (mounted && typeof global.renderGame === "function") global.renderGame();
    return mounted;
  }

  function executeSimpleRevealActions(playerId) {
    if (typeof global.revealUnit !== "function") return [];
    const revealed = [];
    for (const { unit } of chooseRevealActions(playerId)) {
      if (global.revealUnit(unit, "ai-choice", { render: false })) revealed.push(unit);
    }
    if (revealed.length && typeof global.renderGame === "function") global.renderGame();
    return revealed;
  }

  const api = {
    INVALID_SCORE,
    unitsForPlayer,
    adjacentUnits,
    hasAttackTarget,
    wouldAutoReveal,
    wouldActivateConstruct,
    scoreMountAction,
    chooseMountAction,
    scoreReveal,
    chooseRevealActions,
    chooseMountedDamageTarget,
    shouldRecruitConcealed,
    scoreConstructActivationPosition,
    chooseConstructActivationPlan,
    executeSimpleMountAction,
    executeSimpleRevealActions,
  };

  global.WUSAI = Object.assign(global.WUSAI ?? {}, api);
})(window);
