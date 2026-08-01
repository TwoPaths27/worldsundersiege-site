"use strict";

/* Shared presentation hook for card effects. Ongoing effects flash once
 * when first created; triggered/activated effects flash when they resolve. */
(function installActivationFeedback(global) {
  const recent = new Map();

  function sourceFromEvent(event) {
    return event?.source ?? event?.payload?.source ?? event?.payload?.entry?.source ?? event?.payload?.effect?.source ?? null;
  }

  function activationKey(source, eventType) {
    const id = typeof source === "object" ? source?.id : source;
    return `${eventType}:${id ?? "unknown"}`;
  }

  function presentEffectActivation(source, options = {}) {
    if (!source) return false;
    const key = activationKey(source, options.eventType ?? "effect");
    const now = Date.now();
    if (now - (recent.get(key) ?? 0) < 160) return false;
    recent.set(key, now);

    global.showCardEffectActivation?.(source, options);
    global.playEffectActivateSound?.();
    return true;
  }

  global.presentEffectActivation = presentEffectActivation;

  if (typeof global.onGameEvent !== "function") return;

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
