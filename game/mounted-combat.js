"use strict";

/* Worlds Under Siege — v19.4 mounted combat integration. */
(function mountedCombatModule(global) {
  function idOf(unit) {
    return unit?.id ?? unit?.instanceId ?? null;
  }

  function isMountedCharacter(unit) {
    return Boolean(
      unit &&
      (typeof global.isCharacter === "function"
        ? global.isCharacter(unit)
        : unit.type === "Character" || unit.cardType === "Character") &&
      unit.mountedOn
    );
  }

  function isMountedCarrier(unit) {
    return Boolean(unit?.riderId);
  }

  function isAnimalOrConstruct(unit) {
    if (!unit) return false;
    const animal = typeof global.isAnimal === "function"
      ? global.isAnimal(unit)
      : unit.type === "Animal" || unit.cardType === "Animal";
    const construct = typeof global.isConstruct === "function"
      ? global.isConstruct(unit)
      : unit.type === "Construct" || unit.cardType === "Construct";
    return animal || construct;
  }

  function canMountedUnitDeclareAttack(unit) {
    if (!unit) return false;
    return !(isMountedCarrier(unit) && isAnimalOrConstruct(unit));
  }

  function canMountedUnitRetaliate(unit) {
    return canMountedUnitDeclareAttack(unit);
  }

  function getMountedDamageChoices(character) {
    if (!isMountedCharacter(character)) return [character].filter(Boolean);
    const mount = typeof global.getMount === "function"
      ? global.getMount(character)
      : global.GameState?.units?.find((unit) => idOf(unit) === character.mountedOn);
    return mount ? [character, mount] : [character];
  }

  function chooseAIMountedDamageTarget(character, mount, damage) {
    const amount = Math.max(0, Number(damage) || 0);
    if (character.currentHP <= amount) return character;
    if (mount.currentHP <= amount && character.currentHP > amount) return mount;
    return character;
  }

  function chooseMountedDamageTarget(source, mountedCharacter, damage) {
    const choices = getMountedDamageChoices(mountedCharacter);
    if (choices.length < 2) return choices[0] ?? mountedCharacter;

    const [character, mount] = choices;
    const choosingPlayer = Number(source?.owner);

    // Player 1 is the local player in the current hot-seat/AI interface.
    if (choosingPlayer === 1 && typeof global.confirm === "function") {
      const hitMount = global.confirm(
        `${source.name} deals ${Math.max(0, Number(damage) || 0)} combat damage.\n\n` +
        `Choose OK to damage ${mount.name} (Mount).\n` +
        `Choose Cancel to damage ${character.name} (Character).`
      );
      return hitMount ? mount : character;
    }

    return chooseAIMountedDamageTarget(character, mount, damage);
  }

  function applyMountedCombatDamage(attacker, defender, canRetaliate) {
    const attackerDamage = typeof global.getCurrentAttack === "function"
      ? global.getCurrentAttack(attacker)
      : attacker.currentAttack;
    const defenderDamage = typeof global.getCurrentAttack === "function"
      ? global.getCurrentAttack(defender)
      : defender.currentAttack;

    const defenderDamageTarget = chooseMountedDamageTarget(attacker, defender, attackerDamage);
    defenderDamageTarget.currentHP -= attackerDamage;

    let attackerDamageTarget = null;
    if (canRetaliate) {
      attackerDamageTarget = chooseMountedDamageTarget(defender, attacker, defenderDamage);
      attackerDamageTarget.currentHP -= defenderDamage;
    }

    attacker.hasAttacked = true;

    return {
      attackerDamage,
      defenderDamage,
      defenderDamageTarget,
      attackerDamageTarget,
      defenderDestroyed: defenderDamageTarget.currentHP <= 0,
      attackerDestroyed: Boolean(attackerDamageTarget && attackerDamageTarget.currentHP <= 0),
    };
  }

  function prepareMountedUnitForDestruction(unit) {
    if (!unit) return;

    // Rider dies: detach it, leaving the Mount in its current square.
    if (unit.mountedOn) {
      const mount = typeof global.getMount === "function"
        ? global.getMount(unit)
        : null;
      if (mount && mount.riderId === idOf(unit)) mount.riderId = null;
      unit.mountedOn = null;
    }

    // Mount dies: detach the rider into the Mount's square.
    if (unit.riderId) {
      const rider = typeof global.getRider === "function"
        ? global.getRider(unit)
        : global.GameState?.units?.find((candidate) => idOf(candidate) === unit.riderId);
      if (rider) {
        rider.mountedOn = null;
        rider.x = unit.x;
        rider.y = unit.y;
        rider.movementSpent = Math.max(
          Number(rider.movementSpent ?? 0),
          Number(unit.movementSpent ?? 0)
        );
        if (typeof global.getRemainingEffectiveSpeed === "function") {
          rider.remainingSpeed = global.getRemainingEffectiveSpeed(rider);
        }
      }
      unit.riderId = null;
    }
  }

  Object.assign(global, {
    isMountedCharacter,
    isMountedCarrier,
    canMountedUnitDeclareAttack,
    canMountedUnitRetaliate,
    getMountedDamageChoices,
    chooseMountedDamageTarget,
    applyMountedCombatDamage,
    prepareMountedUnitForDestruction,
  });
})(window);
