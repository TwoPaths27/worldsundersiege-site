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

function getAbility(source) {
  return AbilityRegistry[getAbilityId(source)] ?? null;
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
    typeof ability.isEligibleUser === "function" &&
    !ability.isEligibleUser(user, normalizedContext)
  ) {
    return createResolutionResult(false, "illegal-user");
  }

  if (
    ability.targetMode !== "user" &&
    ability.targetMode !== "none"
  ) {
    if (!target) {
      return createResolutionResult(false, "missing-target");
    }

    if (
      typeof ability.isEligibleTarget === "function" &&
      !ability.isEligibleTarget(target, normalizedContext)
    ) {
      return createResolutionResult(false, "illegal-target");
    }
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
