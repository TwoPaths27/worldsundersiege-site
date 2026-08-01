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
    if (now - (recent.get(key) ?? 0) < 320) return false;
    recent.set(key, now);

    global.showCardEffectActivation?.(source, options);
    global.playEffectActivateSound?.();
    return true;
  }

  global.presentEffectActivation = presentEffectActivation;

  if (typeof global.onGameEvent !== "function") return;


  global.onGameEvent("unitRevealed", (event) => {
    const unit = event?.payload?.unit ?? sourceFromEvent(event);
    const text = String(unit?.effectText ?? unit?.rulesText ?? unit?.sourceCard?.effectText ?? "");
    if (!unit || !/\b(?:when|whenever)\b[\s\S]{0,80}\breveal(?:ed)?\b/i.test(text)) return;
    // The battlefield token is normally created by the render that follows the
    // reveal event, so wait two frames before presenting the universal reveal flare.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      presentEffectActivation(unit, {
        eventType: "unitRevealed",
        reveal: true,
        fireworks: true,
        targets: [unit],
      });
    }));
  }, { priority: -45 });

  global.onGameEvent("triggerResolved", (event) => {
    if (event?.payload?.resolution?.resolved === false) return;
    presentEffectActivation(sourceFromEvent(event), { eventType: "triggerResolved" });
  }, { priority: -50 });

  global.onGameEvent("abilityResolved", (event) => {
    if (event?.payload?.resolution?.resolved === false) return;
    presentEffectActivation(sourceFromEvent(event), { eventType: "abilityResolved" });
  }, { priority: -60 });

  global.onGameEvent("continuousEffectAdded", (event) => {
    const effect = event?.payload?.effect;
    if (!effect?.source || effect?.metadata?.suppressActivationFeedback) return;
    presentEffectActivation(effect.source, { eventType: "continuousEffectAdded", ongoing: true });
  }, { priority: -50 });
})(window);
