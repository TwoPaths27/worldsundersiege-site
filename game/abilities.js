"use strict";

/*
 * Worlds Under Siege — Module 12 Ability Engine
 *
 * Abilities are data-driven definitions. Card UI asks the registry how an
 * ability is targeted; the Action Stack asks it to resolve the effect.
 */

const AbilityRegistry = Object.create(null);
const AbilityAliases = Object.create(null);

function normalizeAbilityId(value) {
  return typeof value === "string" ? value.trim() : "";
}

function defaultCharacterUserValidator(unit, context = {}) {
  const playerId =
    context.playerId ??
    context.player?.id ??
    context.owner;

  if (!unit || (playerId != null && unit.owner !== playerId)) {
    return false;
  }

  /*
   * Prefer the capability system, but retain compatibility with battlefield
   * Units created from older Character cards whose capability metadata was
   * not copied onto the runtime Unit object.
   */
  if (
    typeof canUseActions === "function" &&
    canUseActions(unit)
  ) {
    return true;
  }

  const characterType =
    typeof CardTypes !== "undefined"
      ? CardTypes.CHARACTER
      : "Character";

  const runtimeTypes =
    typeof getCardTypes === "function"
      ? getCardTypes(unit)
      : Array.isArray(unit.types)
        ? unit.types
        : [unit.type, unit.cardType].filter(Boolean);

  const sourceTypes =
    unit.sourceCard && typeof getCardTypes === "function"
      ? getCardTypes(unit.sourceCard)
      : Array.isArray(unit.sourceCard?.types)
        ? unit.sourceCard.types
        : [
            unit.sourceCard?.type,
            unit.sourceCard?.cardType,
          ].filter(Boolean);

  return (
    runtimeTypes.includes(characterType) ||
    runtimeTypes.includes("Character") ||
    sourceTypes.includes(characterType) ||
    sourceTypes.includes("Character") ||
    unit.type === "Character" ||
    unit.cardType === "Character" ||
    unit.sourceCard?.type === "Character" ||
    unit.sourceCard?.cardType === "Character"
  );
}

function registerAbility(id, definition, aliases = []) {
  const abilityId = normalizeAbilityId(id);

  if (!abilityId) {
    throw new TypeError("Ability id must be a non-empty string.");
  }

  if (!definition || typeof definition.resolve !== "function") {
    throw new TypeError(`Ability "${abilityId}" must define resolve(context).`);
  }

  AbilityRegistry[abilityId] = Object.freeze({
    id: abilityId,
    targetMode: "user",
    requiresUser: true,
    requiresTarget: null,
    canPlay: () => true,
    isEligibleUser: defaultCharacterUserValidator,
    isEligibleTarget: () => true,
    getUserPrompt: (context) =>
      `Choose who you wish to use ${context.card?.name ?? "this Action"}.`,
    getTargetPrompt: (context) =>
      `Choose a target for ${context.card?.name ?? "this Action"}.`,
    triggers: [],
    ...definition,
  });

  for (const alias of aliases) {
    const normalizedAlias = normalizeAbilityId(alias);
    if (normalizedAlias) AbilityAliases[normalizedAlias] = abilityId;
  }

  return AbilityRegistry[abilityId];
}

function getAbilityId(source) {
  if (!source) return "";

  const rawId = typeof source === "string"
    ? source
    : source.abilityId ?? source.ability ?? source.databaseId ?? source.id;

  const normalizedId = normalizeAbilityId(rawId);
  return AbilityAliases[normalizedId] ?? normalizedId;
}

function createFallbackActionAbility(source) {
  if (!source || typeof source !== "object") return null;

  const actionLike =
    source.cardType === "Action" ||
    source.type === "Action" ||
    (Array.isArray(source.types) && source.types.includes("Action")) ||
    (typeof isAction === "function" && isAction(source));

  if (!actionLike) return null;

  const primaryId =
    normalizeAbilityId(source.abilityId) ||
    normalizeAbilityId(source.ability) ||
    normalizeAbilityId(source.gameplayId) ||
    normalizeAbilityId(source.databaseId) ||
    normalizeAbilityId(source.id) ||
    normalizeAbilityId(source.name);

  if (!primaryId) return null;

  const aliases = [
    source.gameplayId,
    source.databaseId,
    source.id,
    source.name,
  ]
    .map(normalizeAbilityId)
    .filter((value) => value && value !== primaryId);

  return registerAbility(
    primaryId,
    {
      targetMode: "user",
      resolve(context) {
        const { card, user } = context;
        const effectSource = card ?? source;

        if (typeof resolveCardEffects === "function") {
          const resolution = resolveCardEffects(effectSource, context);
          if (resolution.reason !== "no-effects") {
            addLog(
              `${effectSource?.name ?? "Action"} resolves` +
              `${user ? ` with ${user.name} as its User` : ""}.`
            );
            return {
              ...resolution,
              fallback: false,
              abilityId: primaryId,
              userId: user?.id ?? null,
            };
          }
        }

        addLog(
          `${effectSource?.name ?? "Action"} resolves` +
          `${user ? ` with ${user.name} as its User` : ""}.`
        );

        if (effectSource?.effectText) {
          console.info(
            `Action effect pending implementation: ${effectSource.name}`,
            effectSource.effectText
          );
        }

        return {
          resolved: true,
          fallback: true,
          abilityId: primaryId,
          userId: user?.id ?? null,
        };
      },
    },
    aliases
  );
}

function getAbility(source) {
  const abilityId = getAbilityId(source);
  const registered = AbilityRegistry[abilityId] ?? null;
  return registered || createFallbackActionAbility(source);
}

function getAbilityTargetMode(source) {
  return getAbility(source)?.targetMode ?? source?.targetMode ?? "user";
}

function canPlayAbility(source, context = {}) {
  const ability = getAbility(source);
  return Boolean(ability && ability.canPlay(context) !== false);
}

function isEligibleAbilityUser(source, unit, context = {}) {
  const ability = getAbility(source);
  return Boolean(ability && ability.isEligibleUser(unit, context) !== false);
}

function isEligibleAbilityTarget(source, target, context = {}) {
  const ability = getAbility(source);
  return Boolean(ability && ability.isEligibleTarget(target, context) !== false);
}



function createAbilityContext(overrides = {}) {
  const owner = overrides.owner ?? overrides.playerId ?? overrides.stackEntry?.owner;
  const player = owner ? GameState.players[owner] : null;
  const opponent = owner ? GameState.players[owner===1?2:1] : null;
  return {
    game: GameState,
    owner,
    playerId: owner,
    player,
    opponent,
    source: null,
    stackEntry: null,
    card: null,
    user: null,
    target: null,
    ...overrides
  };
}

function createResolutionResult(
  resolved,
  reason = null,
  extra = {}
) {
  return {
    resolved,
    reason,
    ...extra,
  };
}

function executeAbility(source, context = {}) {
  const ability = getAbility(source);

  if (!ability) {
    console.warn("Unknown ability.", source);
    return createResolutionResult(false, "unknown-ability");
  }

  const normalizedContext = createAbilityContext({
    ...context,
    source,
    ability,
  });

  normalizedContext.card ??= source;
  normalizedContext.stackEntry ??= null;

  const { user, target } = normalizedContext;

  if (
    ability.requiresUser !== false &&
    typeof ability.isEligibleUser === "function" &&
    !ability.isEligibleUser(user, normalizedContext)
  ) {
    return createResolutionResult(false, "illegal-user");
  }

  const targetMode = ability.targetMode ?? "user";
  const requiresTarget =
    ability.requiresTarget ??
    (
      targetMode !== "user" &&
      targetMode !== "none"
    );

  if (requiresTarget && !target) {
    return createResolutionResult(false, "missing-target");
  }

  if (
    target &&
    typeof ability.isEligibleTarget === "function" &&
    !ability.isEligibleTarget(target, normalizedContext)
  ) {
    return createResolutionResult(false, "illegal-target");
  }

  try {
    const result = ability.resolve(normalizedContext);

    if (result === undefined) {
      return createResolutionResult(true);
    }

    if (!result || typeof result !== "object") {
      return createResolutionResult(
        Boolean(result),
        result ? null : "ability-returned-false"
      );
    }

    return createResolutionResult(
      result.resolved !== false,
      result.reason ?? null,
      result
    );
  } catch (error) {
    console.error(
      `Ability "${ability.id}" failed during resolution.`,
      error
    );

    return createResolutionResult(false, "resolution-error", { error });
  }
}

registerAbility(
  "takingAim",
  {
    targetMode: "user",

    resolve({ card, user }) {
      if (!user) {
        addLog(`${card?.name ?? "Taking Aim"} resolves without a User.`);
        return { resolved: false, reason: "missing-user" };
      }

      applyTemporaryRangeBonus(user, 2);

      addLog(
        `${card?.name ?? "Taking Aim"} resolves. ` +
        `${user.name} gains +2 Range until the end of the turn.`
      );

      if (typeof showUnitActionFeedback === "function") {
        showUnitActionFeedback(user, "+2 RNG");
      }

      return { resolved: true, userId: user.id, rangeBonus: 2 };
    },
  },
  ["BOA-146", "Taking Aim"]
);


function getAbilityTriggerDefinitions(source) {
  const ability = getAbility(source);

  if (!ability || !ability.triggers) {
    return [];
  }

  return Array.isArray(ability.triggers)
    ? [...ability.triggers]
    : [ability.triggers];
}


function validateAbilityRegistration(source) {
  const abilityId = getAbilityId(source);
  const ability = getAbility(source);

  if (!abilityId) {
    return {
      valid: false,
      abilityId: "",
      reason: "missing-ability-id",
      source,
    };
  }

  if (!ability) {
    return {
      valid: false,
      abilityId,
      reason: "unknown-ability",
      source,
    };
  }

  return {
    valid: true,
    abilityId,
    ability,
    source,
  };
}

function auditActionAbilityRegistrations(cards = []) {
  const results = [];
  const seenObjects = new WeakSet();
  const seenCards = new Set();

  const visit = (value) => {
    if (!value) return;

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    if (typeof value !== "object") return;
    if (seenObjects.has(value)) return;
    seenObjects.add(value);

    if (value.cardType === "Action" || isAction(value)) {
      const key =
        value.databaseId ??
        value.id ??
        `${value.name ?? "Unknown Action"}:${getAbilityId(value)}`;

      if (!seenCards.has(key)) {
        seenCards.add(key);
        results.push({
          name: value.name ?? "Unknown Action",
          databaseId: value.databaseId ?? value.id ?? null,
          ...validateAbilityRegistration(value),
        });
      }
    }

    for (const nested of Object.values(value)) {
      if (nested && typeof nested === "object") {
        visit(nested);
      }
    }
  };

  visit(cards);

  return {
    total: results.length,
    valid: results.filter((result) => result.valid),
    invalid: results.filter((result) => !result.valid),
    results,
  };
}

/* Backward-compatible facade retained for older module code. */
const Abilities = {
  registry: AbilityRegistry,
  register(name, handlerOrDefinition) {
    const definition = typeof handlerOrDefinition === "function"
      ? { resolve: handlerOrDefinition }
      : handlerOrDefinition;
    return registerAbility(name, definition);
  },
  has(name) {
    return Boolean(getAbility(name));
  },
  execute(name, context = {}) {
    return executeAbility(name, context);
  },
};


function triggerAbilities(eventType, context = {}) {
  return emitGameEvent(eventType, context, { source: context.source ?? null });
}
