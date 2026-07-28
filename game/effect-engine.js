"use strict";

/*
 * Worlds Under Siege — V19.9.7 Effect Engine Integration
 *
 * Executes reusable, data-driven one-shot effects. This module intentionally
 * complements effects.js, which remains responsible for continuous modifiers,
 * statuses, and duration cleanup.
 */
(function effectEngineModule(global) {
  const handlers = Object.create(null);
  const aliases = Object.create(null);
  let nextResolutionId = 1;

  const normalize = (value) => typeof value === "string" ? value.trim() : "";
  const asArray = (value) => value == null ? [] : (Array.isArray(value) ? value : [value]);
  const amountOf = (effect, fallback = 1) => Math.max(0, Number(effect.amount ?? effect.value ?? fallback) || 0);

  function registerEffect(type, handler, options = {}) {
    const key = normalize(type);
    if (!key) throw new TypeError("Effect type must be a non-empty string.");
    if (typeof handler !== "function") throw new TypeError(`Effect handler "${key}" must be a function.`);
    handlers[key] = handler;
    for (const alias of options.aliases ?? []) {
      const aliasKey = normalize(alias);
      if (aliasKey) aliases[aliasKey] = key;
    }
    return handler;
  }

  function getEffectType(effect) {
    if (typeof effect === "string") return aliases[effect] ?? effect;
    const raw = normalize(effect?.type ?? effect?.effect ?? effect?.kind);
    return aliases[raw] ?? raw;
  }

  function playerIdOf(value, context = {}) {
    if (value == null || value === "controller" || value === "owner" || value === "you") {
      return Number(context.playerId ?? context.owner ?? context.controller ?? context.player?.id) || null;
    }
    if (value === "opponent" || value === "enemy") {
      const own = playerIdOf(null, context);
      return own === 1 ? 2 : own === 2 ? 1 : null;
    }
    if (typeof value === "object") return Number(value.id ?? value.playerId ?? value.owner) || null;
    return Number(value) || null;
  }

  function playerOf(value, context = {}) {
    const id = playerIdOf(value, context);
    return id ? global.GameState?.players?.[id] ?? null : null;
  }

  function resolveSubject(selector, context = {}) {
    if (selector == null || selector === "target") return context.target ?? null;
    if (selector === "source") return context.source ?? context.card ?? null;
    if (selector === "card") return context.card ?? context.source ?? null;
    if (selector === "user") return context.user ?? null;
    if (selector === "player" || selector === "you" || selector === "controller" || selector === "owner") return playerOf(null, context);
    if (selector === "opponent" || selector === "enemy") return playerOf("opponent", context);
    if (selector === "targets") return context.targets ?? (context.target ? [context.target] : []);
    if (typeof selector === "function") return selector(context);
    return selector;
  }

  function effectLog(message) {
    if (message && typeof global.addLog === "function") global.addLog(message);
  }

  function emit(type, payload, context) {
    if (typeof global.emitGameEvent === "function") {
      global.emitGameEvent(type, payload, { source: context.source ?? context.card ?? null });
    }
  }

  function runStateCheck(context, reason) {
    if (typeof global.runStateBasedActions === "function") {
      global.runStateBasedActions({ source: context.source ?? context.card, reason, render: false });
    }
  }

  function normalizeContext(context = {}) {
    const playerId = playerIdOf(context.playerId ?? context.owner ?? context.controller ?? context.player, context);
    return {
      game: global.GameState,
      source: null,
      card: null,
      user: null,
      target: null,
      targets: null,
      playerId,
      owner: playerId,
      controller: playerId,
      player: playerId ? global.GameState?.players?.[playerId] ?? null : null,
      opponent: playerId ? playerOf("opponent", { playerId }) : null,
      variables: Object.create(null),
      results: [],
      ...context,
      playerId,
      owner: context.owner ?? playerId,
      controller: context.controller ?? playerId,
    };
  }

  function executeEffect(effect, context = {}) {
    const normalizedContext = context.__effectContext ? context : Object.assign(normalizeContext(context), { __effectContext: true });
    if (typeof effect === "function") return effect(normalizedContext);
    if (!effect || typeof effect !== "object") return { resolved: false, reason: "invalid-effect", effect };

    if (typeof effect.condition === "function" && effect.condition(normalizedContext, effect) === false) {
      return { resolved: false, skipped: true, reason: "condition-failed", effect };
    }

    const type = getEffectType(effect);
    const handler = handlers[type];
    if (!handler) {
      console.warn(`Unknown effect type "${type || "(missing)"}".`, effect);
      return { resolved: false, reason: "unknown-effect", type, effect };
    }

    try {
      const value = handler(effect, normalizedContext);
      const result = value && typeof value === "object" && !Array.isArray(value)
        ? { resolved: value.resolved !== false, type, ...value }
        : { resolved: value !== false, type, value };
      normalizedContext.results.push(result);
      return result;
    } catch (error) {
      console.error(`Effect "${type}" failed.`, error);
      const result = { resolved: false, reason: "effect-error", type, error };
      normalizedContext.results.push(result);
      return result;
    }
  }

  function executeEffects(effects, context = {}) {
    const normalizedContext = Object.assign(normalizeContext(context), {
      __effectContext: true,
      resolutionId: context.resolutionId ?? `resolution-${nextResolutionId++}`,
    });
    const definitions = asArray(effects).flatMap((entry) => entry?.type === "sequence" ? asArray(entry.effects) : [entry]);
    const results = [];

    for (const effect of definitions) {
      const result = executeEffect(effect, normalizedContext);
      results.push(result);
      if (result.resolved === false && effect?.optional !== true && effect?.continueOnFailure !== true) break;
    }

    if (typeof global.renderGame === "function" && context.render !== false) global.renderGame();
    emit("effectsResolved", { resolutionId: normalizedContext.resolutionId, results }, normalizedContext);
    return {
      resolved: results.every((result) => result.resolved !== false || result.skipped),
      resolutionId: normalizedContext.resolutionId,
      results,
      context: normalizedContext,
    };
  }

  registerEffect("sequence", (effect, context) => executeEffects(effect.effects ?? [], { ...context, render: false }));

  registerEffect("draw", (effect, context) => {
    const playerId = playerIdOf(effect.player, context);
    const cards = global.drawCards(playerId, amountOf(effect), { reason: effect.reason ?? "effect-draw", source: context.source });
    return { cards, playerId };
  });

  registerEffect("damage", (effect, context) => {
    const amount = amountOf(effect);
    const subjects = asArray(resolveSubject(effect.target ?? "target", context)).filter(Boolean);
    const damaged = [];
    for (const subject of subjects) {
      if (subject.strongholdHealth != null || subject.health != null && !subject.currentHP) {
        const key = subject.strongholdHealth != null ? "strongholdHealth" : "health";
        subject[key] = Math.max(0, Number(subject[key]) - amount);
      } else {
        subject.currentHP = Number(subject.currentHP ?? subject.hp ?? 0) - amount;
      }
      damaged.push(subject);
      emit("effectDamage", { target: subject, amount }, context);
    }
    runStateCheck(context, "effect-damage");
    return { amount, targets: damaged };
  });

  registerEffect("heal", (effect, context) => {
    const amount = amountOf(effect);
    const subjects = asArray(resolveSubject(effect.target ?? "target", context)).filter(Boolean);
    const healed = [];
    for (const subject of subjects) {
      const maximum = typeof global.getCurrentMaxHP === "function"
        ? global.getCurrentMaxHP(subject)
        : Number(subject.printedHP ?? subject.maxHP ?? subject.hp ?? subject.currentHP ?? 0);
      const before = Number(subject.currentHP ?? subject.hp ?? 0);
      subject.currentHP = Math.min(maximum, before + amount);
      healed.push({ target: subject, amount: subject.currentHP - before });
    }
    return { amount, healed };
  });

  registerEffect("gainEnergy", (effect, context) => {
    const player = playerOf(effect.player, context);
    if (!player) return { resolved: false, reason: "missing-player" };
    const amount = amountOf(effect);
    player.energy = Math.max(0, Number(player.energy ?? 0) + amount);
    return { playerId: player.id, amount, energy: player.energy };
  }, { aliases: ["addEnergy"] });

  registerEffect("loseEnergy", (effect, context) => {
    const player = playerOf(effect.player, context);
    if (!player) return { resolved: false, reason: "missing-player" };
    const amount = amountOf(effect);
    const lost = Math.min(amount, Number(player.energy ?? 0));
    player.energy -= lost;
    return { playerId: player.id, amount: lost, energy: player.energy };
  });

  registerEffect("search", (effect, context) => ({
    cards: global.searchDeck(playerIdOf(effect.player, context), {
      amount: amountOf(effect), filter: effect.filter, choose: effect.choose,
      to: effect.to ?? global.ZoneTypes?.HAND ?? "hand", position: effect.position,
      shuffle: effect.shuffle !== false, source: context.source, render: false,
    }),
  }), { aliases: ["searchDeck"] });

  registerEffect("reveal", (effect, context) => ({
    cards: global.revealCardsFromDeck(playerIdOf(effect.player, context), amountOf(effect), {
      source: context.source, silent: effect.silent,
    }),
  }), { aliases: ["revealTop"] });

  registerEffect("mill", (effect, context) => ({
    cards: global.millCards(playerIdOf(effect.player, context), amountOf(effect), {
      to: effect.to, source: context.source, render: false,
    }),
  }));

  registerEffect("recover", (effect, context) => {
    const playerId = playerIdOf(effect.player, context);
    const options = { amount: amountOf(effect), filter: effect.filter, choose: effect.choose, to: effect.to, source: context.source, render: false };
    const from = normalize(effect.from ?? "discard").toLowerCase();
    const cards = from === "banish" ? global.recoverFromBanish(playerId, options) : global.recoverFromDiscard(playerId, options);
    return { cards, playerId, from };
  });

  registerEffect("discard", (effect, context) => ({
    cards: global.discardFromHand(playerIdOf(effect.player, context), {
      amount: amountOf(effect), filter: effect.filter, choose: effect.choose,
      random: effect.random === true, source: context.source, render: false,
    }),
  }));

  registerEffect("banish", (effect, context) => {
    const subject = resolveSubject(effect.target, context);
    if (subject && !Array.isArray(subject) && subject.zone) {
      return { cards: [global.banishCard(subject, effect.from ?? subject.zone, { playerId: playerIdOf(effect.player, context), reason: "effect-banish" })].filter(Boolean) };
    }
    return { cards: global.banishFromZone(playerIdOf(effect.player, context), effect.from ?? global.ZoneTypes?.DISCARD ?? "discard", {
      amount: amountOf(effect), filter: effect.filter, choose: effect.choose, source: context.source, render: false,
    }) };
  });

  registerEffect("moveZone", (effect, context) => ({
    cards: global.moveCardsFromZone(playerIdOf(effect.player, context), effect.from, effect.to, {
      amount: amountOf(effect), filter: effect.filter, choose: effect.choose,
      position: effect.position, source: context.source, render: false,
    }),
  }), { aliases: ["moveCards"] });

  registerEffect("conceal", (effect, context) => {
    const target = resolveSubject(effect.target ?? "target", context);
    if (!target || typeof global.concealUnit !== "function") return { resolved: false, reason: "invalid-target" };
    return { target, changed: global.concealUnit(target, context.source ?? "effect", { reason: "effect-conceal" }) !== false };
  });

  registerEffect("revealConcealed", (effect, context) => {
    const target = resolveSubject(effect.target ?? "target", context);
    const reveal = global.revealConcealedUnit ?? global.revealUnit;
    if (!target || typeof reveal !== "function") return { resolved: false, reason: "invalid-target" };
    return { target, changed: reveal(target, "effect-reveal", { source: context.source }) !== false };
  }, { aliases: ["revealUnit"] });

  registerEffect("destroy", (effect, context) => {
    const targets = asArray(resolveSubject(effect.target ?? "target", context)).filter(Boolean);
    const destroyed = targets.filter((target) => typeof global.destroyUnit === "function" && global.destroyUnit(target, { source: context.source, cause: "effect-destroy" }));
    return { targets: destroyed };
  });

  registerEffect("amass", (effect, context) => ({
    entry: global.amassArmy(playerIdOf(effect.player, context), effect.army ?? effect.armyType ?? context.card, amountOf(effect), {
      source: context.source, reason: "effect-amass", render: false,
    }),
  }), { aliases: ["amassArmy"] });

  registerEffect("reduceArmy", (effect, context) => ({
    entry: global.reduceArmy(playerIdOf(effect.player, context), effect.army ?? effect.armyType, amountOf(effect), {
      source: context.source, reason: "effect-reduce-army", render: false,
    }),
  }));

  registerEffect("addStatus", (effect, context) => {
    const target = resolveSubject(effect.target ?? "target", context);
    if (!target || typeof global.addStatus !== "function") return { resolved: false, reason: "invalid-target" };
    return { status: global.addStatus(target, { type: effect.status ?? effect.statusType, duration: effect.duration, source: context.source, metadata: effect.metadata }) };
  });

  registerEffect("continuous", (effect, context) => {
    if (typeof global.addContinuousEffect !== "function") return { resolved: false, reason: "continuous-engine-unavailable" };
    return { effect: global.addContinuousEffect({ ...effect.definition, source: context.source, controller: playerIdOf(effect.player, context), target: resolveSubject(effect.target, context) }) };
  }, { aliases: ["addContinuousEffect"] });

  registerEffect("log", (effect) => {
    effectLog(effect.message ?? effect.text ?? "An effect resolves.");
    return { message: effect.message ?? effect.text };
  });

  function getCardEffects(card, timing = "resolve") {
    if (!card) return [];
    const source = card.effects ?? card.effect;
    if (Array.isArray(source)) return source;
    if (source && typeof source === "object" && !source.type) return asArray(source[timing] ?? source.onResolve ?? source.resolve);
    return asArray(source);
  }

  function resolveCardEffects(card, context = {}, timing = "resolve") {
    const effects = getCardEffects(card, timing);
    if (!effects.length) return { resolved: false, reason: "no-effects", results: [] };
    return executeEffects(effects, { ...context, source: context.source ?? card, card, render: context.render });
  }

  function auditEffects(cards = []) {
    const issues = [];
    for (const card of cards) {
      for (const effect of getCardEffects(card)) {
        const type = getEffectType(effect);
        if (!type || !handlers[type]) issues.push({ card: card?.name ?? card?.id ?? "Unknown card", type: type || null, effect });
      }
    }
    return issues;
  }

  global.WUSEffectEngine = Object.freeze({
    registerEffect, getEffectType, executeEffect, executeEffects,
    getCardEffects, resolveCardEffects, auditEffects,
    handlers,
  });
  global.registerEffectHandler = registerEffect;
  global.executeEffect = executeEffect;
  global.executeEffects = executeEffects;
  global.resolveCardEffects = resolveCardEffects;
})(window);
