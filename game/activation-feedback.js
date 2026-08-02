"use strict";

/* Shared presentation hook for card effects. Ongoing effects flash once
 * when first created; triggered/activated effects flash when they resolve. */
(function installActivationFeedback(global) {
  const recent = new Map();

  function sourceFromEvent(event) {
    return event?.source ?? event?.payload?.source ?? event?.payload?.entry?.source ?? event?.payload?.effect?.source ?? null;
  }

  function activationKey(source) {
    const id = typeof source === "object" ? source?.id : source;
    return String(id ?? "unknown");
  }

  function presentEffectActivation(source, options = {}) {
    if (!source) return false;
    const key = activationKey(source);
    const now = Date.now();
    if (!options.force && now - (recent.get(key) ?? 0) < 320) return false;
    recent.set(key, now);

    global.showCardEffectActivation?.(source, options);
    global.playEffectActivateSound?.();
    return true;
  }

  global.presentEffectActivation = presentEffectActivation;

  if (typeof global.onGameEvent !== "function") return;


  function isMerlin(source) {
    if (!source) return false;
    const identities = [source.databaseId, source.gameplayId, source.variantOf, source.sharedCardId]
      .filter(Boolean)
      .map((value) => String(value).toUpperCase());
    return source.name === "Merlin" || identities.includes("BOA-002") || identities.includes("MERLIN");
  }

  function hasOnRevealEffect(unit) {
    if (!unit || isMerlin(unit)) return false;
    const text = String(unit.effectText ?? unit.rulesText ?? unit.sourceCard?.effectText ?? "");
    return /\b(?:when|whenever)\b[\s\S]{0,110}\b(?:is|was|becomes?|are)?\s*revealed\b/i.test(text);
  }

  global.hasOnRevealEffect = hasOnRevealEffect;

  global.onGameEvent("unitRevealed", (event) => {
    const unit = event?.payload?.unit ?? sourceFromEvent(event);
    if (!hasOnRevealEffect(unit)) return;

    // Face-up recruitment emits before the token is guaranteed to exist. Wait
    // until the render completes, then play the same reveal presentation for
    // every true on-reveal trigger in the game.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      presentEffectActivation(unit, {
        eventType: "unitRevealed",
        reveal: true,
        fireworks: true,
        force: true,
        targets: [unit],
      });
    }));
  }, { priority: -45 });

  global.onGameEvent("merlinFreeActionUsed", (event) => {
    const merlin = event?.payload?.merlin ?? sourceFromEvent(event);
    const action = event?.payload?.action ?? null;
    presentEffectActivation(merlin, {
      eventType: "merlinFreeActionUsed",
      fireworks: true,
      force: true,
      targets: action ? [action] : [merlin],
      impactText: "0",
    });
  }, { priority: -45 });

  global.onGameEvent("triggerResolved", (event) => {
    if (event?.payload?.resolution?.resolved === false) return;
    const source = sourceFromEvent(event);
    if (isMerlin(source)) return;
    presentEffectActivation(source, { eventType: "triggerResolved" });
  }, { priority: -50 });

  global.onGameEvent("abilityResolved", (event) => {
    if (event?.payload?.resolution?.resolved === false) return;
    const source = sourceFromEvent(event);
    if (isMerlin(source)) return;
    presentEffectActivation(source, { eventType: "abilityResolved" });
  }, { priority: -60 });

  global.onGameEvent("continuousEffectAdded", (event) => {
    const effect = event?.payload?.effect;
    if (!effect?.source || effect?.metadata?.suppressActivationFeedback) return;
    presentEffectActivation(effect.source, { eventType: "continuousEffectAdded", ongoing: true });
  }, { priority: -50 });
})(window);
